import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import { logServerError } from "@/lib/server-log.mjs";

const MAX_VIDEO_DATA_URI_LENGTH = 3_600_000;

function isValidHeroVideo(value: unknown): value is string {
  if (typeof value !== "string" || value.length > MAX_VIDEO_DATA_URI_LENGTH) return false;
  if (value === "") return true;
  if (/^data:video\/(mp4|webm);base64,[A-Za-z0-9+/=]+$/i.test(value)) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && /\.(mp4|webm)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await readBoundedJson(request, 4_000_000);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return NextResponse.json({ error: "Hero video settings are invalid." }, { status: 400 });
  }

  const body = parsed.value as Record<string, unknown>;
  const opacity = body.opacity;
  if (!isValidHeroVideo(body.video)) {
    return NextResponse.json({ error: "Choose an MP4 or WebM video, or use a direct HTTPS video URL." }, { status: 400 });
  }
  if (typeof opacity !== "number" || !Number.isInteger(opacity) || opacity < 0 || opacity > 100) {
    return NextResponse.json({ error: "Video opacity must be between 0 and 100." }, { status: 400 });
  }

  try {
    const previous = await prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { heroVideo: true },
    });
    const result = await prisma.$runCommandRaw({
      update: "StoreSettings",
      updates: [{
        q: { _id: "default" },
        u: { $set: { heroVideo: body.video, heroVideoOpacity: opacity } },
        upsert: false,
      }],
    });

    if (result.ok !== 1 || Number(result.n) !== 1) {
      return NextResponse.json({
        error: "Store settings were not updated. Refresh the page and try again.",
      }, { status: 409 });
    }

    const previousVideo = previous?.heroVideo;
    if (previousVideo && previousVideo !== body.video) {
      try {
        const previousUrl = new URL(previousVideo);
        if (previousUrl.hostname.endsWith(".public.blob.vercel-storage.com")) {
          await del(previousVideo);
        }
      } catch (error) {
        logServerError("security.admin.settings.hero_video_cleanup_failed", error);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/settings");
    return NextResponse.json({ success: true, video: body.video, opacity });
  } catch (error) {
    logServerError("security.admin.settings.hero_video_command_failed", error);
    return NextResponse.json({
      error: "The hero video could not be saved. The existing video was kept.",
    }, { status: 503 });
  }
}
