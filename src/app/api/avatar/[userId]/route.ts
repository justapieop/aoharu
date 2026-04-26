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
  
  // Directly pull the bytea output from Postgres natively
  const { data, error } = await supabase
    .from("profiles")
    .select("avatar")
    .eq("id", userId)
    .single();

  if (error || !data || !data.avatar) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    let buffer: Buffer;
    
    // Supabase PostgREST maps bytea dynamically to standard hex format '\\xDEAD...`
    if (typeof data.avatar === 'string' && data.avatar.startsWith('\\x')) {
      buffer = Buffer.from(data.avatar.slice(2), 'hex');
    } else {
      // Fallback format execution handler
      buffer = Buffer.from(data.avatar, 'base64'); 
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg", 
        // Allow clients to cache strictly but utilize 'must-revalidate' behavior when we append custom ?v= timestamps
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (err) {
    return new NextResponse("Invalid avatar encoding", { status: 500 });
  }
}
