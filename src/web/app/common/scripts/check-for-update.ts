import CONFIG from './config';

declare var VERSION: string;

export default function() {
	fetch(CONFIG.apiUrl + '/meta', {
		method: 'POST'
	}).then(res => {
		res.json().then(meta => {
			if (meta.version != VERSION) {
				localStorage.setItem('should-refresh', 'true');
				alert('%i18n:common.update-available%'.replace('{newer}', meta.version).replace('{current}', VERSION));
			}
		});
	});
}
