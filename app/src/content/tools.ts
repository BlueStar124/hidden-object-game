import type { ToolId } from '../core/model';

/** What the detective's tools are called and do (core/tools), as the player reads it. */
export const TOOLS: Record<ToolId, { name: string; description: string }> = {
  'uv-lens': {
    name: 'Kính Tia Tím',
    description:
      'Soi lên trang giấy, kính làm hiện những lời nhắn viết bằng mực tàng hình. Các trang Singapore đã chơi giờ có thêm lời nhắn của vị kiến trúc sư: hãy quay lại tìm!',
  },
};
