import { version as current } from '../../config';

export default async function($root: any, force = false, silent = false) {
	return null; // サーバーのバージョンなんて気にすんな

	// const meta = await $root.getMeta(force);
	// const newer = meta.version;

	// if (newer != current) {
	// 	localStorage.setItem('should-refresh', 'true');
	// 	localStorage.setItem('v', newer);

	// 	// Clear cache (service worker)
	// 	try {
	// 		if (navigator.serviceWorker.controller) {
	// 			navigator.serviceWorker.controller.postMessage('clear');
	// 		}

	// 		const registrations = await navigator.serviceWorker.getRegistrations();
	// 		for (const registration of registrations) {
	// 			registration.unregister();
	// 		}
	// 	} catch (e) {
	// 		console.error(e);
	// 	}

	// 	/*if (!silent) {
	// 		$root.dialog({
	// 			title: $root.$t('@.update-available-title'),
	// 			text: $root.$t('@.update-available', { newer, current })
	// 		});
	// 	}*/

	// 	return newer;
	// } else {
	// 	return null;
	// }
}
