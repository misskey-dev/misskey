require('fuckadblock');
import dialog from './dialog';

declare const fuckAdBlock: any;

export default () => {
	if (fuckAdBlock === undefined) {
		adBlockDetected();
	} else {
		fuckAdBlock.onDetected(adBlockDetected);
	}
};

function adBlockDetected() {
	dialog('%fa:exclamation-triangle%広告ブロッカーを無効にしてください',
		'<strong>Misskeyは広告を掲載していません</strong>が、広告をブロックする機能が有効だと一部の機能が利用できなかったり、不具合が発生する場合があります。',
	[{
		text: 'OK'
	}]);
}
