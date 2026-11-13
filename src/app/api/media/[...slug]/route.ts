import { NextRequest, NextResponse } from "next/server";
import { getCachedRawProductMedia, getCachedRawSettingsMedia } from "@/lib/cachedStore";
import { getMediaHash, isSettingsMediaField, parseMediaDataUri } from "@/lib/mediaUrl";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await context.params;
  if (!Array.isArray(slug) || slug.length < 3) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let rawDataUri: string | null = null;
  let expectedHash = "";

  if (slug[0] === "product") {
    const productId = slug[1];
    if (!productId || !/^[a-fA-F0-9]{24}$/.test(productId)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const media = await getCachedRawProductMedia(productId);
    if (!media) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (slug[2] === "main") {
      rawDataUri = media.imageUrl || null;
      expectedHash = slug[3] || "";
    } else if (slug[2] === "images" && slug.length >= 4) {
      const idx = Number.parseInt(slug[3], 10);
      expectedHash = slug[4] || "";
      if (Number.isInteger(idx) && idx >= 0 && media.additionalImages) {
        try {
          const parsed = JSON.parse(media.additionalImages);
          if (Array.isArray(parsed) && typeof parsed[idx] === "string") {
            rawDataUri = parsed[idx];
          }
        } catch {
          rawDataUri = null;
        }
      }
    }
  } else if (slug[0] === "settings") {
    const field = slug[1];
    expectedHash = slug[2] || "";
    if (!field || !isSettingsMediaField(field)) {
      return new NextResponse("Not Found", { status: 404 });
    }
    rawDataUri = await getCachedRawSettingsMedia(field);
  }

  if (!rawDataUri || !rawDataUri.startsWith("data:")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const parsed = parseMediaDataUri(rawDataUri);
  if (!parsed) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const actualHash = getMediaHash(rawDataUri);
  const etag = `"${actualHash}"`;
  const isImmutable = Boolean(expectedHash && expectedHash === actualHash);
  const cacheControl = isImmutable
    ? "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400, immutable"
    : "public, max-age=60, s-maxage=60, must-revalidate";

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": cacheControl,
        "CDN-Cache-Control": cacheControl,
        "Vercel-CDN-Cache-Control": cacheControl,
      },
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": parsed.mimeType,
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cacheControl,
    "Vercel-CDN-Cache-Control": cacheControl,
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
  };

  if (parsed.mimeType === "image/svg+xml") {
    headers["Content-Security-Policy"] = "sandbox";
  }

  const totalLength = parsed.buffer.length;
  const rangeHeader = request.headers.get("range");
  if (parsed.mimeType.startsWith("video/") && rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (match) {
      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const end = match[2] ? Math.min(Number.parseInt(match[2], 10), totalLength - 1) : totalLength - 1;
      if (start >= 0 && start <= end && end < totalLength) {
        const chunk = parsed.buffer.subarray(start, end + 1);
        return new NextResponse(new Uint8Array(chunk), {
          status: 206,
          headers: {
            ...headers,
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes ${start}-${end}/${totalLength}`,
            "Content-Length": String(chunk.length),
          },
        });
      }
    }
  }

  headers["Content-Length"] = String(totalLength);
  if (parsed.mimeType.startsWith("video/")) {
    headers["Accept-Ranges"] = "bytes";
  }

  return new NextResponse(new Uint8Array(parsed.buffer), {
    status: 200,
    headers,
  });
}

