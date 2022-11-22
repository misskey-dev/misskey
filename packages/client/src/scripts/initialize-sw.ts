import { instance } from '@/instance';
import { $i } from '@/account';
import { api } from '@/os';
import { lang } from '@/config';

export async function initializeSw() {
	if (!('serviceWorker' in navigator)) return;

	navigator.serviceWorker.register(`/sw.js`, { scope: '/', type: 'classic' });
	navigator.serviceWorker.ready.then(registration => {
		registration.active?.postMessage({
			msg: 'initialize',
			lang,
		});
	});
}
