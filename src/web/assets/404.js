const yn = window.confirm(
	'サーバー上に存在しないスクリプトがリクエストされました。お使いのMisskeyのバージョンが古いことが原因の可能性があります。Misskeyを更新しますか？');

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
} else {
	alert('問題が解決しない場合はサーバー管理者までお問い合せください。');
}
