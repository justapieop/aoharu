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

  // Get the avatar UUID from the profiles table (used to verify an avatar exists)
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar")
    .eq("id", userId)
    .single();

  if (error || !data || !data.avatar) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    // Download from the deterministic path in the "avatars" bucket
    const filePath = `${userId}/avatar`;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("avatars")
      .download(filePath);

    if (downloadError || !fileData) {
      return new NextResponse("Failed to download avatar", { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": fileData.type || "image/jpeg",
        // Allow clients to cache strictly but utilize 'must-revalidate' behavior when we append custom ?v= timestamps
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    return new NextResponse("Error serving avatar", { status: 500 });
  }
}
