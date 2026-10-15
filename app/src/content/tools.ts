import type { ToolId } from '../core/model';

/**
 * What the detective's tools are called and do (core/tools), as the player reads it. `finds`: what
 * the objects a tool reveals are called; `badge`: the same, short, on the clue bar.
 */
export const TOOLS: Record<ToolId, { name: string; description: string; finds: string; badge: string }> = {
  'uv-lens': {
    name: 'Kính Tia Tím',
    description:
      'Soi lên trang giấy, kính làm hiện những lời nhắn viết bằng mực tàng hình. Các trang Singapore đã chơi giờ có thêm lời nhắn của vị kiến trúc sư: hãy quay lại tìm!',
    finds: 'Lời nhắn mực tàng hình',
    badge: 'Mực tàng hình',
  },
  prism: {
    name: 'Lăng Kính Pha Lê',
    description:
      'Lăng kính chiếu một dải cầu vồng ngang tròng kính lúp. Những nét vẽ bằng ánh sáng của người thầy chỉ hiện ra trong dải sáng ấy: hãy rê kính thật chậm qua các trang Thái Lan.',
    finds: 'Nét vẽ cầu vồng',
    badge: 'Cầu vồng',
  },
  'twin-lens': {
    name: 'Kính Lúp Hai Tròng',
    description:
      'Lồng thêm một tròng kính, bạn thấy được những nét vẽ tí hon của người họa sĩ cung đình. Chúng quá nhỏ cho mắt thường: phóng to trang (từ ×2) rồi mới soi kính, trên khắp các trang Việt Nam.',
    finds: 'Nét vẽ tí hon',
    badge: 'Tí hon',
  },
};
