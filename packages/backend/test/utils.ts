export function sleep(msec: number) {
	return new Promise<void>(res => {
		setTimeout(() => {
			res();
		}, msec);
	});
}
