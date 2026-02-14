// @ts-expect-error gifenc has no type declarations
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

/**
 * Extract frames from a video element between startTime and endTime.
 * Draws each frame to an offscreen canvas at the target outputWidth,
 * preserving aspect ratio.
 */
export async function extractFrames(
  video: HTMLVideoElement,
  startTime: number,
  endTime: number,
  fps: number,
  outputWidth: number,
  onProgress?: (percent: number) => void
): Promise<ImageData[]> {
  const aspectRatio = video.videoHeight / video.videoWidth;
  const outputHeight = Math.round(outputWidth * aspectRatio);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d')!;

  const duration = endTime - startTime;
  const totalFrames = Math.max(1, Math.floor(duration * fps));
  const frames: ImageData[] = [];

  for (let i = 0; i < totalFrames; i++) {
    const time = startTime + i / fps;
    video.currentTime = time;

    await new Promise<void>((resolve) => {
      const handler = () => {
        video.removeEventListener('seeked', handler);
        resolve();
      };
      video.addEventListener('seeked', handler);
    });

    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(video, 0, 0, outputWidth, outputHeight);
    frames.push(ctx.getImageData(0, 0, outputWidth, outputHeight));

    onProgress?.(((i + 1) / totalFrames) * 100);

    // Yield to UI thread
    await new Promise((r) => setTimeout(r, 0));
  }

  return frames;
}

/**
 * Encode an array of ImageData frames into a GIF Uint8Array using gifenc.
 */
export function encodeGif(
  frames: ImageData[],
  width: number,
  height: number,
  fps: number,
  onProgress?: (percent: number) => void
): Uint8Array {
  const encoder = GIFEncoder();
  const delay = Math.round(1000 / fps);

  for (let i = 0; i < frames.length; i++) {
    const rgba = frames[i].data;
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    encoder.writeFrame(index, width, height, { palette, delay });
    onProgress?.(((i + 1) / frames.length) * 100);
  }

  encoder.finish();
  return encoder.bytes() as Uint8Array;
}
