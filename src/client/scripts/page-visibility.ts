export function onBecomeVisible(cb) {
	const onVisible = (ev) => {
		if (document.visibilityState !== 'visible') return;
		document.removeEventListener('visibilitychange', onVisible);
		cb();
	};

	document.addEventListener('visibilitychange', onVisible);

	return {
		remove: () => document.removeEventListener('visibilitychange', onVisible)
	};
}
