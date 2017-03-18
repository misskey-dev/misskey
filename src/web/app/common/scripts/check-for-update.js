import CONFIG from './config';

export default function() {
	fetch(CONFIG.apiUrl + '/meta', {
		method: 'POST'
	}).then(res => {
		res.json().then(meta => {
			if (meta.version != VERSION) {
				localStorage.setItem('should-refresh', 'true');
				alert('Misskeyの新しいバージョンがあります。ページを再度読み込みすると更新が適用されます。');
			}
		});
	});
};
