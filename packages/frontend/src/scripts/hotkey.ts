/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import keyCode from './keycode.js';

type Callback = (ev: KeyboardEvent) => void;

type Keymap = Record<string, Callback>;

type Pattern = {
	which: string[];
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
};

type Action = {
	patterns: Pattern[];
	callback: Callback;
	allowRepeat: boolean;
};

const parseKeymap = (keymap: Keymap) => Object.entries(keymap).map(([patterns, callback]): Action => {
	const result = {
		patterns: [],
		callback,
		allowRepeat: true,
	} as Action;

	if (patterns.match(/^\(.*\)$/) !== null) {
		result.allowRepeat = false;
		patterns = patterns.slice(1, -1);
	}

	result.patterns = patterns.split('|').map(part => {
		const pattern = {
			which: [],
			ctrl: false,
			alt: false,
			shift: false,
		} as Pattern;

		const keys = part.trim().split('+').map(x => x.trim().toLowerCase());
		for (const key of keys) {
			switch (key) {
				case 'ctrl': pattern.ctrl = true; break;
				case 'alt': pattern.alt = true; break;
				case 'shift': pattern.shift = true; break;
				default: pattern.which = keyCode(key).map(k => k.toLowerCase());
			}
		}

		return pattern;
	});

	return result;
});

const ignoreElements = ['input', 'textarea'];

function match(ev: KeyboardEvent, patterns: Action['patterns']): boolean {
	const key = ev.key.toLowerCase();
	return patterns.some(pattern => pattern.which.includes(key) &&
		pattern.ctrl === ev.ctrlKey &&
		pattern.shift === ev.shiftKey &&
		pattern.alt === ev.altKey &&
		!ev.metaKey,
	);
}

export const makeHotkey = (keymap: Keymap) => {
	const actions = parseKeymap(keymap);

	return (ev: KeyboardEvent) => {
		if (document.activeElement) {
			if (ignoreElements.some(el => document.activeElement!.matches(el))) return;
			if (document.activeElement.attributes['contenteditable']) return;
		}

		for (const action of actions) {
			const matched = match(ev, action.patterns);

			if (matched) {
				if (!action.allowRepeat && ev.repeat) return;

				ev.preventDefault();
				ev.stopPropagation();
				action.callback(ev);
				break;
			}
		}
	};
};
