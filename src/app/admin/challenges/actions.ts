"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createChallengeAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.admin !== true) {
    return { success: false, error: "Forbidden" };
  }

  const name = formData.get("name") as string;
  const started_at = formData.get("started_at") as string;
  const ends_at = formData.get("ends_at") as string;
  const points = parseInt(formData.get("points") as string, 10);

  if (!name || !started_at || !ends_at || isNaN(points)) {
    return { success: false, error: "Missing required fields" };
  }

  const { error } = await supabase.from("challenges").insert({
    name,
    started_at: new Date(started_at).toISOString(),
    ends_at: new Date(ends_at).toISOString(),
    points,
    created_by: user.id
  });

  if (error) {
    console.error("Error creating challenge:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/challenges");
  return { success: true };
}

export async function deleteChallengeAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.admin !== true) {
    return { success: false, error: "Forbidden" };
  }

  const { error } = await supabase.from("challenges").delete().eq("id", id);

  if (error) {
    console.error("Error deleting challenge:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/challenges");
  return { success: true };
}
