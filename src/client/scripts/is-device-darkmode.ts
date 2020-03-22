export function isDeviceDarkmode() {
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
