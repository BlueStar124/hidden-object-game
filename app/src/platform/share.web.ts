import type { ShareOutcome } from './share';

/** A user dismissing the share sheet is not a failure. */
const dismissed = (e: unknown) => e instanceof Error && e.name === 'AbortError';

async function copy(text: string): Promise<ShareOutcome> {
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Web: the share sheet of the browser (phones), else the clipboard (most computers). */
export async function shareText(text: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (e) {
      if (dismissed(e)) return 'cancelled';
    }
  }
  return copy(text);
}

function jpegFile(jpegBase64: string, fileName: string): File {
  const bytes = Uint8Array.from(atob(jpegBase64), (ch) => ch.charCodeAt(0));
  return new File([bytes], fileName, { type: 'image/jpeg' });
}

/** Web: the picture through the share sheet if the browser shares files, else downloaded (text copied). */
export async function shareImage(jpegBase64: string, fileName: string, text: string): Promise<ShareOutcome> {
  try {
    const file = jpegFile(jpegBase64, fileName);
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return 'shared';
      } catch (e) {
        if (dismissed(e)) return 'cancelled';
      }
    }
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    // The download has started by now; the object URL can go
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    await copy(text);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
