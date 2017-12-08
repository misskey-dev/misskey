import MiOS from '../mios';

declare const _VERSION_: string;

export default async function(mios: MiOS) {
	const meta = await mios.getMeta();

	if (meta.version != _VERSION_) {
		localStorage.setItem('should-refresh', 'true');

		// Clear cache (serive worker)
		try {
			navigator.serviceWorker.controller.postMessage('clear');

			navigator.serviceWorker.getRegistrations().then(registrations => {
				registrations.forEach(registration => registration.unregister());
			});
		} catch (e) {
			console.error(e);
		}

		alert('%i18n:common.update-available%'.replace('{newer}', meta.version).replace('{current}', _VERSION_));
	}
}
