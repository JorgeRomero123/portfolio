import { renderIcon } from './og-art';

/** The tab icon. Drawn at 64px so it stays sharp on high-density screens; browsers scale it down. */
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return renderIcon(64, 14);
}
