export default ($root: any) => {
	if ($root.$store.getters.isSignedIn) return;

	os.dialog({
		title: $root.$t('signinRequired'),
		text: null
	});

	throw new Error('signin required');
};
