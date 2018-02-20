require('fuckadblock');

declare const fuckAdBlock: any;

export default (os) => {
	function adBlockDetected() {
		os.apis.dialog({
			title: '%fa:exclamation-triangle%広告ブロッカーを無効にしてください',
			text: '<strong>Misskeyは広告を掲載していません</strong>が、広告をブロックする機能が有効だと一部の機能が利用できなかったり、不具合が発生する場合があります。',
			actins: [{
				text: 'OK'
			}]
		});
	}

	if (fuckAdBlock === undefined) {
		adBlockDetected();
	} else {
		fuckAdBlock.onDetected(adBlockDetected);
	}
};
