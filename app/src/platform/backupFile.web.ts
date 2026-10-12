import * as DocumentPicker from 'expo-document-picker';
import type { ShareOutcome } from './share';

/** Web: the backup is downloaded. */
export async function saveBackupFile(text: string, fileName: string): Promise<ShareOutcome> {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    // The download has started by now; the object URL can go
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

/** Web: the browser's file chooser. */
export async function pickBackupFile(): Promise<string | null> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain'], base64: false });
    if (picked.canceled || !picked.assets?.length) return null;
    const asset = picked.assets[0];
    return asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text();
  } catch {
    return null;
  }
}
