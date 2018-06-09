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

// Detect Edge
if (navigator.userAgent.toLowerCase().indexOf('edge') != -1) {
	alert(
		'現在、お使いのブラウザ(Microsoft Edge)ではMisskeyは正しく動作しません。' +
		'サポートしているブラウザ: Google Chrome, Mozilla Firefox, Apple Safari など' +
		'\n\n' +
		'Currently, Misskey cannot run correctly on your browser (Microsoft Edge). ' +
		'Supported browsers: Google Chrome, Mozilla Firefox, Apple Safari, etc');
}

// Check whether cookie enabled
if (!navigator.cookieEnabled) {
	alert(
		'Misskeyを利用するにはCookieを有効にしてください。' +
		'\n\n' +
		'To use Misskey, please enable Cookie.');
}
