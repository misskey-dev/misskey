/**
 * Replace fontawesome symbols
 */

import * as fontawesome from '@fortawesome/fontawesome';
import * as regular from '@fortawesome/fontawesome-free-regular';
import * as solid from '@fortawesome/fontawesome-free-solid';
import * as brands from '@fortawesome/fontawesome-free-brands';

// Add icons
fontawesome.library.add(regular);
fontawesome.library.add(solid);
fontawesome.library.add(brands);

export const pattern = /%fa:(.+?)%/g;

export const replacement = (match, key) => {
	const args = key.split(' ');
	let prefix = 'fas';
	const classes = [];
	let transform = '';
	let name;

	args.forEach(arg => {
		if (arg == 'R' || arg == 'S' || arg == 'B') {
			prefix =
				arg == 'R' ? 'far' :
				arg == 'S' ? 'fas' :
				arg == 'B' ? 'fab' :
				'';
		} else if (arg[0] == '.') {
			classes.push('fa-' + arg.substr(1));
		} else if (arg[0] == '-') {
			transform = arg.substr(1).split('|').join(' ');
		} else {
			name = arg;
		}
	});

	const icon = fontawesome.icon({ prefix, iconName: name }, {
		classes: classes
	});

	if (icon) {
		icon.transform = fontawesome.parse.transform(transform);
		return `<i data-fa class="${name}">${icon.html[0]}</i>`;
	} else {
		console.warn(`'${name}' not found in fa`);
		return '';
	}
};

export default (src: string) => {
	return src.replace(pattern, replacement);
};

export const fa = fontawesome;
