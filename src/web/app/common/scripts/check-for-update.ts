import MiOS from '../mios';

declare const _VERSION_: string;

export default async function(mios: MiOS) {
	const meta = await mios.getMeta();

	if (meta.version != _VERSION_) {
		localStorage.setItem('should-refresh', 'true');
		alert('%i18n:common.update-available%'.replace('{newer}', meta.version).replace('{current}', _VERSION_));
	}
}
