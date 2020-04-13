export function isDeviceTouch(): boolean {
	return 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 0;
}
