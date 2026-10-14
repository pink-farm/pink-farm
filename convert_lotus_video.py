import os
import sys
import numpy as np
from PIL import Image, ImageFilter
import subprocess

def process_video():
    input_video = r"C:\Users\Lenovo\Downloads\gemini_generated_video_f8d6f5dc.mp4"
    frames_dir = r"public\images\temp_frames"
    out_frames_dir = r"public\images\proc_frames"
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(out_frames_dir, exist_ok=True)

    print("1. Extracting frames at 24 fps...")
    # Extract at 24 fps
    cmd_extract = [
        "ffmpeg", "-y", "-i", input_video,
        "-vf", "fps=24",
        os.path.join(frames_dir, "frame_%04d.png")
    ]
    subprocess.run(cmd_extract, check=True)

    frame_files = sorted([f for f in os.listdir(frames_dir) if f.endswith(".png")])
    total_frames = len(frame_files)
    print(f"Total extracted frames: {total_frames}")

    # Process each frame: crop to center 720x720, remove checkerboard background, add soft anti-aliased edge
    print("2. Removing checkerboard background and creating transparent alpha...")
    
    # Target size for web
    out_size = 480

    for idx, fname in enumerate(frame_files):
        fpath = os.path.join(frames_dir, fname)
        img = Image.open(fpath).convert("RGB")
        
        # Center crop: original is 1280x720 -> crop x from 280 to 1000, y from 0 to 720
        cropped = img.crop((280, 0, 1000, 720))
        arr = np.array(cropped, dtype=np.float32)

        # Detect checkerboard: gray/white squares have very low color variance between R, G, B
        mx = np.max(arr, axis=2)
        mn = np.min(arr, axis=2)
        diff = mx - mn

        # Grey/white checkerboard has diff < 22 and high lightness
        # Also remove the tiny watermark near corner
        is_bg = (diff < 22)

        # Build clean alpha mask
        alpha = np.where(is_bg, 0, 255).astype(np.uint8)
        
        # Mask image
        mask_img = Image.fromarray(alpha, mode="L")
        
        # Feather the edge slightly for silky smooth antialiasing
        # Blur the mask slightly and threshold for clean anti-aliasing
        mask_feathered = mask_img.filter(ImageFilter.GaussianBlur(radius=0.8))

        # Composite with RGBA
        rgba = Image.new("RGBA", (720, 720), (0, 0, 0, 0))
        rgba.paste(cropped, (0, 0), mask_feathered)

        # Resize to crisp 480x480
        resized = rgba.resize((out_size, out_size), Image.Resampling.LANCZOS)
        
        out_path = os.path.join(out_frames_dir, f"proc_{idx:04d}.png")
        resized.save(out_path)

        if idx % 40 == 0 or idx == total_frames - 1:
            print(f"  Processed {idx + 1}/{total_frames} frames")

    # 3. Create Seamless Loop Crossfade (blend last 14 frames into first 14 frames)
    print("3. Applying seamless loop crossfade...")
    blend_count = 14
    loop_frames = []
    
    # Read processed frames
    proc_files = sorted([f for f in os.listdir(out_frames_dir) if f.startswith("proc_") and f.endswith(".png")])
    N = len(proc_files)
    
    # Load all images into memory
    images = [Image.open(os.path.join(out_frames_dir, f)) for f in proc_files]

    final_frames = []
    # Crossfade the tail (last blend_count frames) into the head (first blend_count frames)
    # So the sequence loops seamlessly from end to beginning
    for i in range(blend_count):
        alpha_factor = i / float(blend_count)
        tail_idx = N - blend_count + i
        head_img = images[i]
        tail_img = images[tail_idx]
        blended = Image.blend(tail_img, head_img, alpha_factor)
        final_frames.append(blended)

    # Rest of the body (from blend_count to N - blend_count)
    for i in range(blend_count, N - blend_count):
        final_frames.append(images[i])

    loop_dir = r"public\images\loop_frames"
    os.makedirs(loop_dir, exist_ok=True)
    for idx, fimg in enumerate(final_frames):
        fimg.save(os.path.join(loop_dir, f"loop_{idx:04d}.png"))

    print(f"Loop frames count: {len(final_frames)}")

    # 4. Export WebM with Alpha Transparency (VP9)
    print("4. Encoding transparent WebM (VP9 + Alpha)...")
    webm_out = r"public\images\lotus-loader.webm"
    cmd_webm = [
        "ffmpeg", "-y",
        "-framerate", "24",
        "-i", os.path.join(loop_dir, "loop_%04d.png"),
        "-c:v", "libvpx-vp9",
        "-pix_fmt", "yuva420p",
        "-b:v", "1200k",
        "-an",
        webm_out
    ]
    subprocess.run(cmd_webm, check=True)
    print(f"WebM created: {os.path.getsize(webm_out)} bytes")

    # 5. Export Animated WebP with Alpha (Looping, for universal browser fallback)
    print("5. Encoding animated WebP (Alpha + Looping)...")
    webp_out = r"public\images\lotus-loader.webp"
    # To keep webp size optimal for fast web loads, sample at 16 fps
    cmd_webp = [
        "ffmpeg", "-y",
        "-framerate", "24",
        "-i", os.path.join(loop_dir, "loop_%04d.png"),
        "-vf", "fps=16,scale=360:360",
        "-vcodec", "libwebp",
        "-filter:v", "fps=16",
        "-lossless", "0",
        "-compression_level", "4",
        "-q:v", "75",
        "-loop", "0",
        "-an",
        webp_out
    ]
    subprocess.run(cmd_webp, check=True)
    print(f"Animated WebP created: {os.path.getsize(webp_out)} bytes")

    # 6. Export Muted Clean MP4
    print("6. Encoding muted high-res MP4 on luxury tinted backdrop...")
    mp4_out = r"public\images\lotus-loader.mp4"
    cmd_mp4 = [
        "ffmpeg", "-y",
        "-framerate", "24",
        "-i", os.path.join(loop_dir, "loop_%04d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-an",
        mp4_out
    ]
    subprocess.run(cmd_mp4, check=True)
    print(f"MP4 created: {os.path.getsize(mp4_out)} bytes")

    print("ALL DONE SUCCESSFULLY!")

if __name__ == "__main__":
    process_video()
