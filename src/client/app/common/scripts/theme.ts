import * as tinycolor from 'tinycolor2';
const lightTheme = require('../../../theme/light');
const darkTheme = require('../../../theme/dark');

type Theme = {
	meta: {
		id: string;
		name: string;
		inherit: string;
		vars: any;
	};
} & {
	[key: string]: string;
};

export default function(theme: Theme) {
	if (theme.meta.inherit) {
		const inherit = [lightTheme, darkTheme].find(x => x.meta.id == theme.meta.inherit);
		theme = Object.assign({}, inherit, theme);
	}

	const props = compile(theme);

	Object.entries(props).forEach(([k, v]) => {
		if (k == 'meta') return;
		document.documentElement.style.setProperty(`--${k}`, v.toString());
	});

	localStorage.setItem('theme', JSON.stringify(props));
}

function compile(theme: Theme): { [key: string]: string } {
	function getColor(code: string): tinycolor.Instance {
		// ref
		if (code[0] == '@') {
			return getColor(theme[code.substr(1)]);
		}
		if (code[0] == '$') {
			return getColor(theme.meta.vars[code.substr(1)]);
		}

		// func
		if (code[0] == ':') {
			const parts = code.split('<');
			const func = parts.shift().substr(1);
			const arg = parseInt(parts.shift(), 10);
			const color = getColor(parts.join('<'));

			switch (func) {
				case 'darken': return color.darken(arg);
				case 'lighten': return color.lighten(arg);
			}
		}

		return tinycolor(code);
	}

	const props = {};

	Object.entries(theme).forEach(([k, v]) => {
		if (k == 'meta') return;
		const c = getColor(v);
		props[k] = genValue(c);
		props[`${k}-r`] = c.toRgb().r;
		props[`${k}-g`] = c.toRgb().g;
		props[`${k}-b`] = c.toRgb().b;
		props[`${k}-a`] = c.toRgb().a;
	});

	const primary = getColor(props['primary']);

	for (let i = 1; i < 10; i++) {
		const color = primary.clone().setAlpha(i / 10);
		props['primaryAlpha0' + i] = genValue(color);
	}

	for (let i = 1; i < 100; i++) {
		const color = primary.clone().lighten(i);
		props['primaryLighten' + i] = genValue(color);
	}

	for (let i = 1; i < 100; i++) {
		const color = primary.clone().darken(i);
		props['primaryDarken' + i] = genValue(color);
	}

	return props;
}

function genValue(c: tinycolor.Instance): string {
	return c.toRgbString();
}
