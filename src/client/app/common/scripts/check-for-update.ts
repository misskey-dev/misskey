import { clientVersion as current } from '../../config';

export default async function($root: any, force = false, silent = false) {
	const meta = await $root.getMeta(force);
	const newer = meta.clientVersion;

	if (newer != current) {
		localStorage.setItem('should-refresh', 'true');
		localStorage.setItem('v', newer);

		// Clear cache (service worker)
		try {
			if (navigator.serviceWorker.controller) {
				navigator.serviceWorker.controller.postMessage('clear');
			}

			navigator.serviceWorker.getRegistrations().then(registrations => {
				registrations.forEach(registration => registration.unregister());
			});
		} catch (e) {
			console.error(e);
		}

		if (!silent) {
			$root.$dialog({
				title: '%i18n:common.update-available-title%',
				text: '%i18n:common.update-available%'.replace('{newer}', newer).replace('{current}', current)
			});
		}

		return newer;
	} else {
		return null;
	}
}
