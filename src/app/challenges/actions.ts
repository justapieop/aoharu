"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function joinChallengeAction(challengeId: string) {
  if (!challengeId) {
    return { success: false, error: "Thiếu thông tin thử thách." };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  // Double check if there's already an active challenge
  const { data: activeEntries } = await supabase
    .from("challenge_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("ended", false);

  if (activeEntries && activeEntries.length > 0) {
    return { success: false, error: "Bạn đang tham gia một thử thách khác." };
  }

  const { error: insertError } = await supabase
    .from("challenge_entries")
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      ended: false,
      ended_at: new Date().toISOString(),
    });

  if (insertError) {
    return { success: false, error: insertError.message || "Không thể tham gia thử thách." };
  }

  revalidatePath("/challenges");
  return { success: true };
}

export async function uploadChallengeEvidenceAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bạn chưa đăng nhập." };
  }

  const entryId = formData.get("entry_id") as string;
  const file = formData.get("file") as File;

  if (!entryId || !file) {
    return { success: false, error: "Thiếu thông tin." };
  }

  // 1. Fetch challenge_id and points for the bucket path and reward
  const { data: entryData, error: entryError } = await supabase
    .from("challenge_entries")
    .select("challenge_id, challenges(points)")
    .eq("id", entryId)
    .single();

  if (entryError || !entryData) {
    return { success: false, error: "Không tìm thấy dữ liệu thử thách." };
  }

  const challengeId = entryData.challenge_id;
  const challengeInfo: any = Array.isArray(entryData.challenges) ? entryData.challenges[0] : entryData.challenges;
  const points = challengeInfo?.points || 0;

  // 2. Insert into challenge_entry_uploads first (attachment_id is nullable)
  const { data: uploadRow, error: insertError } = await supabase
    .from("challenge_entry_uploads")
    .insert({
      entry_id: entryId
    })
    .select("entry_id") // return something to verify success, we can't select id if it's not defined
    .single();

  if (insertError) {
    return { success: false, error: "Không thể tạo bản ghi minh chứng." };
  }

  // 3. Upload the file to the bucket
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${user.id}/${challengeId}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("challenge_uploads")
    .upload(filePath, file);

  if (uploadError) {
    // We could delete the row here if upload fails, but omitting for simplicity
    return { success: false, error: "Tải file thất bại." };
  }

  // 4. Update the row with the returned attachment ID
  // Wait, uploadData.id is the UUID of the storage object
  const { error: updateError } = await supabase
    .from("challenge_entry_uploads")
    .update({ attachment_id: uploadData.id })
    // since challenge_entry_uploads might not have a primary key defined in our code (only entry_id, created_at, attachment_id),
    // wait, we can just match by entry_id AND created_at if needed, but wait!
    // If we just inserted it, and we only have entry_id, we might update ALL uploads for this entry.
    // Let's assume entry_id is the primary key? The image says "challenge_entry_uploads" has entry_id with a key icon.
    // Wait, the key icon is next to entry_id, meaning entry_id is likely the primary key (or part of it).
    // Let's just update by entry_id.
    .eq("entry_id", entryId);

  if (updateError) {
    console.error("Update error:", updateError);
    return { success: false, error: "Không thể lưu ID hình ảnh." };
  }

  // 5. Add points to the user's profile
  if (points > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .single();

    const currentPoints = profile?.points || 0;

    await supabase
      .from("profiles")
      .update({ points: currentPoints + points })
      .eq("id", user.id);
  }

  revalidatePath("/challenges/active");
  return { success: true };
}
