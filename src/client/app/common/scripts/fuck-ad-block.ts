declare const fuckAdBlock: any;

export default ($root: any) => {
	require('fuckadblock');

	function adBlockDetected() {
		$root.$dialog({
			title: '%fa:exclamation-triangle%%i18n:common.adblock.detected%',
			text: '%i18n:common.adblock.warning%',
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
