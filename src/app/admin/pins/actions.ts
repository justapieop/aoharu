"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPinTypeAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();

  if (!name) {
    console.error("Tên marker type không được để trống.");
    return;
  }

  if (!icon) {
    console.error("Icon không được để trống.");
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("Bạn chưa đăng nhập.");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.admin !== true) {
    console.error("Bạn không có quyền tạo marker type.");
    return;
  }

  const { error: insertError } = await supabase.from("pin_types").insert({
    name,
    icon,
    created_by: user.id,
  });

  if (insertError) {
    console.error(insertError.message);
    return;
  }

  revalidatePath("/admin/pins");
}

export async function createPinAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const pinTypeId = String(formData.get("pin_type_id") ?? "").trim();
  const latValue = String(formData.get("lat") ?? "").trim();
  const longValue = String(formData.get("long") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawImage = formData.get("image");
  const imageFile = rawImage instanceof File && rawImage.size > 0 ? rawImage : null;
  const sponsored = formData.get("sponsored") === "on";
  const openingDayValues = formData
    .getAll("opening_days")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);

  if (!name || !pinTypeId || !latValue || !longValue) {
    console.error("Thiếu dữ liệu để tạo pin.");
    return;
  }

  if (openingDayValues.length === 0) {
    console.error("Hãy chọn ít nhất 1 ngày mở cửa.");
    return;
  }

  const lat = Number(latValue);
  const long = Number(longValue);

  if (!Number.isFinite(lat) || !Number.isFinite(long)) {
    console.error("Tọa độ không hợp lệ.");
    return;
  }

  if (imageFile && !imageFile.type.startsWith("image/")) {
    console.error("Tệp tải lên phải là ảnh.");
    return;
  }

  let openingDaysMask = 0;
  for (const dayIndex of openingDayValues) {
    openingDaysMask |= 1 << dayIndex;
  }

  const { supabase, user, error } = await requireAdminUser();
  if (error || !user) {
    console.error(error);
    return;
  }

  const { data: pinType, error: pinTypeError } = await supabase
    .from("pin_types")
    .select("id")
    .eq("id", pinTypeId)
    .maybeSingle();

  if (pinTypeError || !pinType) {
    console.error("Marker type không tồn tại.");
    return;
  }

  const { data: insertedPin, error: insertError } = await supabase
    .from("pins")
    .insert({
      name,
      lat,
      long,
      address: address || null,
      description: description || null,
      image_id: null,
      opening_days: Buffer.from([openingDaysMask]).toString("base64"),
      sponsored,
      pin_type_id: pinTypeId,
    })
    .select("id")
    .maybeSingle();

  if (insertError || !insertedPin) {
    console.error(insertError?.message || "Không thể tạo pin.");
    return;
  }

  if (imageFile) {
    const imagePath = `pins/${insertedPin.id}/${crypto.randomUUID()}_${imageFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("assets")
      .upload(imagePath, imageFile, { upsert: false });

    if (uploadError || !uploadData?.id) {
      console.error(uploadError?.message || "Không thể tải ảnh lên bucket assets.");
      revalidatePath("/admin/pins");
      return;
    }

    const { error: updateImageIdError } = await supabase
      .from("pins")
      .update({ image_id: uploadData.id })
      .eq("id", insertedPin.id);

    if (updateImageIdError) {
      console.error(updateImageIdError.message);
      revalidatePath("/admin/pins");
      return;
    }
  }

  revalidatePath("/admin/pins");
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "Bạn chưa đăng nhập." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.admin !== true) {
    return { supabase, user: null, error: "Bạn không có quyền thực hiện thao tác này." };
  }

  return { supabase, user, error: null };
}

export async function updatePinTypeAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();

  if (!id || !name || !icon) {
    console.error("Thiếu dữ liệu để cập nhật marker type.");
    return;
  }

  const { supabase, user, error } = await requireAdminUser();
  if (error || !user) {
    console.error(error);
    return;
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("pin_types")
    .update({ name, icon })
    .eq("id", id)
    .select("id");

  if (updateError) {
    console.error(updateError.message);
    return;
  }

  if ((updatedRows?.length ?? 0) === 0) {
    console.error("Không thể cập nhật marker type này.");
    return;
  }

  revalidatePath("/admin/pins");
}

export async function deletePinTypeAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    console.error("Thiếu id để xóa marker type.");
    return;
  }

  const { supabase, user, error } = await requireAdminUser();
  if (error || !user) {
    console.error(error);
    return;
  }

  const { error: deleteError, count } = await supabase
    .from("pin_types")
    .delete({ count: "exact" })
    .eq("id", id);

  if (deleteError) {
    console.error(deleteError.message);
    return;
  }

  if ((count ?? 0) === 0) {
    console.error("Không thể xóa marker type này.");
    return;
  }

  revalidatePath("/admin/pins");
}

export async function updatePinAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const pinTypeId = String(formData.get("pin_type_id") ?? "").trim();
  const latValue = String(formData.get("lat") ?? "").trim();
  const longValue = String(formData.get("long") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawImage = formData.get("image");
  const imageFile = rawImage instanceof File && rawImage.size > 0 ? rawImage : null;
  const sponsored = formData.get("sponsored") === "on";
  const openingDayValues = formData
    .getAll("opening_days")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);

  if (!id || !name || !pinTypeId || !latValue || !longValue) {
    console.error("Thiếu dữ liệu để cập nhật pin.");
    return;
  }

  if (openingDayValues.length === 0) {
    console.error("Hãy chọn ít nhất 1 ngày mở cửa.");
    return;
  }

  const lat = Number(latValue);
  const long = Number(longValue);

  if (!Number.isFinite(lat) || !Number.isFinite(long)) {
    console.error("Tọa độ pin không hợp lệ.");
    return;
  }

  if (imageFile && !imageFile.type.startsWith("image/")) {
    console.error("Tệp tải lên phải là ảnh.");
    return;
  }

  let openingDaysMask = 0;
  for (const dayIndex of openingDayValues) {
    openingDaysMask |= 1 << dayIndex;
  }

  const { supabase, user, error } = await requireAdminUser();
  if (error || !user) {
    console.error(error);
    return;
  }

  const { data: pinType, error: pinTypeError } = await supabase
    .from("pin_types")
    .select("id")
    .eq("id", pinTypeId)
    .maybeSingle();

  if (pinTypeError || !pinType) {
    console.error("Marker type không tồn tại.");
    return;
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("pins")
    .update({
      name,
      pin_type_id: pinTypeId,
      lat,
      long,
      address: address || null,
      description: description || null,
      opening_days: Buffer.from([openingDaysMask]).toString("base64"),
      sponsored,
    })
    .eq("id", id)
    .select("id");

  if (updateError) {
    console.error(updateError.message);
    return;
  }

  if ((updatedRows?.length ?? 0) === 0) {
    console.error("Không thể cập nhật pin này.");
    return;
  }

  if (imageFile) {
    const imagePath = `pins/${id}/${crypto.randomUUID()}_${imageFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("assets")
      .upload(imagePath, imageFile, { upsert: false });

    if (uploadError || !uploadData?.id) {
      console.error(uploadError?.message || "Không thể tải ảnh pin mới lên bucket assets.");
      revalidatePath("/admin/pins");
      return;
    }

    const { error: updateImageIdError } = await supabase
      .from("pins")
      .update({ image_id: uploadData.id })
      .eq("id", id);

    if (updateImageIdError) {
      console.error(updateImageIdError.message);
      revalidatePath("/admin/pins");
      return;
    }
  }

  revalidatePath("/admin/pins");
}

export async function deletePinAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    console.error("Thiếu id để xóa pin.");
    return;
  }

  const { supabase, user, error } = await requireAdminUser();
  if (error || !user) {
    console.error(error);
    return;
  }

  const pinFolder = `pins/${id}`;
  const { data: pinFiles, error: pinFilesError } = await supabase.storage
    .from("assets")
    .list(pinFolder, { limit: 100 });

  if (!pinFilesError) {
    const pinPaths = (pinFiles ?? []).map((file) => `${pinFolder}/${file.name}`);
    if (pinPaths.length > 0) {
      const { error: storageDeleteError } = await supabase.storage
        .from("assets")
        .remove(pinPaths);
      if (storageDeleteError) {
        console.error("Failed to remove pin assets:", storageDeleteError.message);
      }
    }
  } else {
    console.error("Failed to list pin assets:", pinFilesError.message);
  }

  const { error: deleteError, count } = await supabase
    .from("pins")
    .delete({ count: "exact" })
    .eq("id", id);

  if (deleteError) {
    console.error(deleteError.message);
    return;
  }

  if ((count ?? 0) === 0) {
    console.error("Không thể xóa pin này.");
    return;
  }

  revalidatePath("/admin/pins");
}