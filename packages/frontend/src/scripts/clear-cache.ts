import { unisonReload } from '@/scripts/unison-reload.js';
import * as os from '@/os.js';
import { miLocalStorage } from '@/local-storage.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';

export async function clearCache() {
	os.waiting();
	miLocalStorage.removeItem('locale');
	miLocalStorage.removeItem('localeVersion');
	miLocalStorage.removeItem('theme');
	miLocalStorage.removeItem('emojis');
	miLocalStorage.removeItem('lastEmojisFetchedAt');
	await fetchCustomEmojis(true);
	unisonReload();
}
