/**
 * 古いブラウザの検知を行う
 * ブートローダーとは隔離されているため互いに影響を及ぼすことはない
 */

// Detect an old browser
if (!('fetch' in window)) {
	alert(
		'お使いのブラウザが古いためMisskeyを動作させることができません。' +
		'バージョンを最新のものに更新するか、別のブラウザをお試しください。' +
		'\n\n' +
		'Your browser seems outdated. ' +
		'To run Misskey, please update your browser to latest version or try other browsers.');
}
