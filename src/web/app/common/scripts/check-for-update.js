import CONFIG from './config';

export default function() {
	fetch(CONFIG.apiUrl + '/meta', {
		method: 'POST'
	}).then(res => {
		res.json().then(meta => {
			if (meta.version != VERSION) {
				localStorage.setItem('should-refresh', 'true');
				alert(`Misskeyの新しいバージョンがあります(${meta.version}。現在を${VERSION}利用中)。\nページを再度読み込みすると更新が適用されます。`);
			}
		});
	});
};
