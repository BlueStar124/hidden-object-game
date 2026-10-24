import { Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { ShareOutcome } from './share';

/** iOS/Android: the system share sheet. */
export async function shareText(text: string): Promise<ShareOutcome> {
  try {
    const result = await Share.share({ message: text });
    return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    return 'failed';
  }
}

/** The picture is written to the cache (the share sheet takes files), then offered to other apps. */
export async function shareImage(jpegBase64: string, fileName: string, text: string): Promise<ShareOutcome> {
  try {
    if (!(await Sharing.isAvailableAsync())) return shareText(text);
    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    await file.write(jpegBase64, { encoding: 'base64' }); // async since SDK 58
    await Sharing.shareAsync(file.uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg', dialogTitle: text });
    return 'shared';
  } catch {
    return 'failed';
  }
}
