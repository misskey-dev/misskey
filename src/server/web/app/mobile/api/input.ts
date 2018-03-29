export default function(opts) {
	return new Promise<string>((res, rej) => {
		const x = window.prompt(opts.title);
		if (x) {
			res(x);
		}
	});
}
