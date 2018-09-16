/**
 * Replace fontawesome symbols
 */

import * as fontawesome from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

fontawesome.library.add(far, fas, fab);

export const pattern = /%fa:(.+?)%/g;

export const replacement = (match: string, key: string) => {
	const args = key.split(' ');
	let prefix = 'fas';
	const classes: string[] = [];
	let transform = '';
	let name;

	args.forEach(arg => {
		if (arg == 'R' || arg == 'S' || arg == 'B') {
			prefix =
				arg == 'R' ? 'far' :
				arg == 'S' ? 'fas' :
				arg == 'B' ? 'fab' :
				'';
		} else if (arg.startsWith('.')) {
			classes.push(`fa-${arg.substr(1)}`);
		} else if (arg.startsWith('-')) {
			transform = arg.substr(1).split('|').join(' ');
		} else {
			name = arg;
		}
	});

	const icon = fontawesome.icon({ prefix, iconName: name } as fontawesome.IconLookup, {
		classes: classes,
		transform: fontawesome.parse.transform(transform)
	});

	if (icon) {
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
