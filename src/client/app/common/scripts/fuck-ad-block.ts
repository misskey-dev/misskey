declare const fuckAdBlock: unknown;

export default ($root: unknown) => {
	require('fuckadblock');

	function adBlockDetected() {
		$root.dialog({
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
