import MiOS from '../mios';

declare var VERSION: string;

export default async function(mios: MiOS) {
	const meta = await mios.getMeta();

	if (meta.version != VERSION) {
		localStorage.setItem('should-refresh', 'true');
		alert('%i18n:common.update-available%'.replace('{newer}', meta.version).replace('{current}', VERSION));
	}
}
