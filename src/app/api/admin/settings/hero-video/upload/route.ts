import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { isSameOriginMutation } from "@/lib/request-security.mjs";
import { logServerError } from "@/lib/server-log.mjs";

const MAX_HERO_VIDEO_BYTES = 50 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 32_000) {
      return NextResponse.json({ error: "Upload request is invalid." }, { status: 413 });
    }

    const body = await request.json() as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        if (!isSameOriginMutation(request)) throw new Error("Cross-origin request rejected.");
        if (!(await requireAdminSession())) throw new Error("Unauthorized");
        if (!/\.(mp4|webm)$/i.test(pathname)) throw new Error("Only MP4 and WebM videos are accepted.");

        return {
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_HERO_VIDEO_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 30,
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    logServerError("security.admin.settings.hero_video_upload_failed", error);
    const message = error instanceof Error && /unauthorized|cross-origin/i.test(error.message)
      ? error.message
      : "Video upload failed. Check that a public Vercel Blob store is connected, then try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
