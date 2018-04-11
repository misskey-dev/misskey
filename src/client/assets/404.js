const yn = window.confirm(
	'サーバー上に存在しないスクリプトがリクエストされました。お使いのMisskeyのバージョンが古いことが原因の可能性があります。Misskeyを更新しますか？\n\nA script that does not exist on the server was requested. It may be caused by an old version of Misskey you’re using. Do you want to delete the cache?');

const langYn = window.confirm('また、言語を日本語に設定すると解決する場合があります。日本語に設定しますか？\n\nAlso, setting the language to Japanese may solve the problem. Would you like to set it to Japanese?');

if (langYn) {
	localStorage.setItem('lang', 'ja');
}

if (yn) {
	// Clear cache (serive worker)
	try {
		navigator.serviceWorker.controller.postMessage('clear');

		navigator.serviceWorker.getRegistrations().then(registrations => {
			registrations.forEach(registration => registration.unregister());
		});
	} catch (e) {
		console.error(e);
	}

	localStorage.removeItem('v');

	location.reload(true);
}
