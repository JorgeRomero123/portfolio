/**
 * Encode a video clip to WebM using an offscreen video, canvas, and MediaRecorder.
 * The video plays in real-time from startTime to endTime while frames are drawn
 * onto a resized canvas and the canvas stream is recorded.
 */
export async function encodeVideoToWebM(
  videoSrc: string,
  startTime: number,
  endTime: number,
  outputWidth: number,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const video = document.createElement('video');
  video.src = videoSrc;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
  });

  const aspectRatio = video.videoHeight / video.videoWidth;
  const outputHeight = Math.round(outputWidth * aspectRatio);

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d')!;

  // Seek to start position
  video.currentTime = startTime;
  await new Promise<void>((resolve) => {
    video.addEventListener('seeked', () => resolve(), { once: true });
  });

  const stream = canvas.captureStream();

  // Pick best supported codec
  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
  }
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2_500_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const duration = endTime - startTime;

  return new Promise<Blob>((resolve, reject) => {
    let stopped = false;

    const finish = () => {
      if (stopped) return;
      stopped = true;
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.pause();
      if (recorder.state === 'recording') recorder.stop();
      stream.getTracks().forEach((t) => t.stop());
      onProgress?.(100);
    };

    const onTimeUpdate = () => {
      if (video.currentTime >= endTime) finish();
    };

    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
    recorder.onerror = () => {
      finish();
      reject(new Error('Recording failed'));
    };

    video.addEventListener('timeupdate', onTimeUpdate);

    recorder.start(100);
    video.play();

    const drawFrame = () => {
      if (stopped) return;
      ctx.drawImage(video, 0, 0, outputWidth, outputHeight);
      const elapsed = video.currentTime - startTime;
      onProgress?.(Math.min((elapsed / duration) * 100, 99));
      requestAnimationFrame(drawFrame);
    };

    requestAnimationFrame(drawFrame);

    // Safety timeout in case video stalls
    setTimeout(finish, (duration + 5) * 1000);
  });
}
