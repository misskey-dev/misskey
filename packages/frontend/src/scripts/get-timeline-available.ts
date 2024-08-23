import { $i } from '@/account.js';
import { instance } from '@/instance.js';

// Ensure $i is initialized before using it
if (typeof $i === 'undefined') {
	throw new Error('$i is not initialized');
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const isLocalTimelineAvailable = ($i == null && instance?.policies?.ltlAvailable) || ($i != null && $i?.policies?.ltlAvailable);
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const isGlobalTimelineAvailable = ($i == null && instance?.policies?.gtlAvailable) || ($i != null && $i?.policies?.gtlAvailable);
