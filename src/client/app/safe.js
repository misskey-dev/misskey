/**
 * ブラウザの検証
 */

// Detect an old browser
if (!('fetch' in window)) {
	alert(
		'お使いのブラウザ(またはOS)のバージョンが旧式のため、Groundpolisを動作させることができません。' +
		'バージョンを最新のものに更新するか、別のブラウザをお試しください。' +
		'\n\n' +
		'Your browser (or your OS) seems outdated. ' +
		'To run Groundpolis, please update your browser to latest version or try other browsers.');
}
