import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  // Next 15 Dynamic Routing: the params object is deeply a Promise and must be correctly awaited.
  { params }: { params: Promise<{ userId: string }> }
) {
  const resolvedParams = await params;
  const userId = resolvedParams.userId;

  if (!userId) {
    return new NextResponse("User ID required", { status: 400 });
  }

  const supabase = await createClient();

  // Look up the file UUID stored in profiles.avatar
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !profile.avatar) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Fetch file metadata from the "files" table using the UUID
  const { data: fileRecord, error: fileError } = await supabase
    .from("files")
    .select("name, bucket_name, path, mime_type")
    .eq("id", profile.avatar)
    .single();

  if (fileError || !fileRecord) {
    return new NextResponse("File record not found", { status: 404 });
  }

  // Download the file from Supabase Storage
  // Path in bucket is /{user's id}/{filename}
  const storagePath = `${userId}/${fileRecord.name}`;
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(fileRecord.bucket_name)
    .download(storagePath);

  if (downloadError || !fileData) {
    return new NextResponse("File download failed", { status: 500 });
  }

  const arrayBuffer = await fileData.arrayBuffer();

  return new NextResponse(new Uint8Array(arrayBuffer), {
    headers: {
      "Content-Type": fileRecord.mime_type || "image/jpeg",
      // Allow clients to cache strictly but utilize 'must-revalidate' behavior when we append custom ?v= timestamps
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
