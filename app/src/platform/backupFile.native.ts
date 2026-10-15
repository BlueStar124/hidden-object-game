import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { ShareOutcome } from './share';

/** iOS/Android: the file goes through the cache to the share sheet (save to Files, Drive…). */
export async function saveBackupFile(text: string, fileName: string): Promise<ShareOutcome> {
  try {
    if (!(await Sharing.isAvailableAsync())) return 'failed';
    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    file.write(text);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Lưu bản sao lưu' });
    return 'shared';
  } catch {
    return 'failed';
  }
}

/** iOS/Android: the document picker, copied to the cache so it can be read at once. */
export async function pickBackupFile(): Promise<string | null> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.length) return null;
    return await new File(picked.assets[0].uri).text();
  } catch {
    return null;
  }
}
