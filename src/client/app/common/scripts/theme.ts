export default function(theme: { [key: string]: string }) {
	const props = compile(theme);

	Object.entries(props).forEach(([k, v]) => {
		if (k == 'meta') return;
		document.documentElement.style.setProperty(`--${k}`, v.toString());
	});

	localStorage.setItem('theme', JSON.stringify(props));
}

function compile(theme: { [key: string]: string }): { [key: string]: string } {
	function getRgba(code: string): number[] {
		// ref
		if (code[0] == '@') {
			return getRgba(theme[code.substr(1)]);
		}

		let m;

		//#region #RGB
		m = code.match(/^#([0-9a-f]{3})$/i);
		if (m) {
			return [
				parseInt(m[1].charAt(0), 16) * 0x11,
				parseInt(m[1].charAt(1), 16) * 0x11,
				parseInt(m[1].charAt(2), 16) * 0x11,
				255
			];
		}
		//#endregion

		//#region #RRGGBB
		m = code.match(/^#([0-9a-f]{6})$/i);
		if (m) {
			return [
				parseInt(m[1].substr(0, 2), 16),
				parseInt(m[1].substr(2, 2), 16),
				parseInt(m[1].substr(4, 2), 16),
				255
			];
		}
		//#endregion

		return [0, 0, 0, 255];
	}

	const props = {};

	Object.entries(theme).forEach(([k, v]) => {
		if (k == 'meta') return;
		const [r, g, b, a] = getRgba(v);
		props[k] = genValue(r, g, b, a);
		props[`${k}-r`] = r;
		props[`${k}-g`] = g;
		props[`${k}-b`] = b;
		props[`${k}-a`] = a;
	});

	return props;
}

function genValue(r: number, g: number, b: number, a: number): string {
	return a != 255 ? `rgba(${r}, ${g}, ${b}, ${a})` : `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}
