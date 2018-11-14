declare const fuckAdBlock: any;

export default ($root: any) => {
	require('fuckadblock');

	function adBlockDetected() {
		$root.alert({
			title: $root.$t('@.adblock.detected'),
			text: $root.$t('@.adblock.warning')
		});
	}

	if (fuckAdBlock === undefined) {
		adBlockDetected();
	} else {
		fuckAdBlock.onDetected(adBlockDetected);
	}
};
