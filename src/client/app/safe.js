/**
 * ブラウザの検証
 */

// Detect an old browser
if (!('fetch' in window)) {
	alert(
		'お使いのブラウザ(またはOS)が古いためMisskeyを動作させることができません。' +
		'バージョンを最新のものに更新するか、別のブラウザをお試しください。' +
		'\n\n' +
		'Your browser (or your OS) seems outdated. ' +
		'To run Misskey, please update your browser to latest version or try other browsers.');
}

// Check whether cookie enabled
if (!navigator.cookieEnabled) {
	alert(
		'Misskeyを利用するにはCookieを有効にしてください。' +
		'\n\n' +
		'To use Misskey, please enable Cookie.');
}
