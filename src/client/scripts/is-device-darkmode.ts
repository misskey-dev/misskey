export function isDeviceDarkmode() {
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
