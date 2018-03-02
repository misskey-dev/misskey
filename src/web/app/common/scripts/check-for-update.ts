import MiOS from '../mios';
import { version } from '../../config';

export default async function(mios: MiOS, force = false, silent = false) {
	const meta = await mios.getMeta(force);

	if (meta.version != version) {
		localStorage.setItem('should-refresh', 'true');

		// Clear cache (serive worker)
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
			alert('%i18n:common.update-available%'.replace('{newer}', meta.version).replace('{current}', version));
		}

		return meta.version;
	} else {
		return null;
	}
}
