/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

//#region types
export type Keymap = Record<string, CallbackFunction | CallbackObject>;

type CallbackFunction = (ev: KeyboardEvent) => unknown;

type CallbackObject = {
	callback: CallbackFunction;
	allowRepeat?: boolean;
};

type Pattern = {
	which: string[];
	ctrl: boolean;
	alt: boolean;
	shift: boolean;
};

type Action = {
	patterns: Pattern[];
	callback: CallbackFunction;
	options: Required<Omit<CallbackObject, 'callback'>>;
};
//#endregion

//#region consts
const KEY_ALIASES = {
	'esc': 'Escape',
	'enter': ['Enter', 'NumpadEnter'],
	'space': [' ', 'Spacebar'],
	'up': 'ArrowUp',
	'down': 'ArrowDown',
	'left': 'ArrowLeft',
	'right': 'ArrowRight',
	'plus': ['+', ';'],
};

const MODIFIER_KEYS = ['ctrl', 'alt', 'shift'];

const IGNORE_ELEMENTS = ['input', 'textarea'];
//#endregion

//#region impl
export const makeHotkey = (keymap: Keymap) => {
	const actions = parseKeymap(keymap);
	return (ev: KeyboardEvent) => {
		if ('pswp' in window && window.pswp != null) return;
		if (document.activeElement != null) {
			if (IGNORE_ELEMENTS.includes(document.activeElement.tagName.toLowerCase())) return;
			if ((document.activeElement as HTMLElement).isContentEditable) return;
		}
		for (const { patterns, callback, options } of actions) {
			if (matchPatterns(ev, patterns, options)) {
				ev.preventDefault();
				ev.stopPropagation();
				callback(ev);
			}
		}
	};
};

const parseKeymap = (keymap: Keymap) => {
	return Object.entries(keymap).map(([rawPatterns, rawCallback]) => {
		const patterns = parsePatterns(rawPatterns);
		const callback = parseCallback(rawCallback);
		const options = parseOptions(rawCallback);
		return { patterns, callback, options } as const satisfies Action;
	});
};

const parsePatterns = (rawPatterns: keyof Keymap) => {
	return rawPatterns.split('|').map(part => {
		const keys = part.split('+').map(trimLower);
		const which = parseKeyCode(keys.findLast(x => !MODIFIER_KEYS.includes(x)));
		const ctrl = keys.includes('ctrl');
		const alt = keys.includes('alt');
		const shift = keys.includes('shift');
		return { which, ctrl, alt, shift } as const satisfies Pattern;
	});
};

const parseCallback = (rawCallback: Keymap[keyof Keymap]) => {
	if (typeof rawCallback === 'object') {
		return rawCallback.callback;
	}
	return rawCallback;
};

const parseOptions = (rawCallback: Keymap[keyof Keymap]) => {
	const defaultOptions = {
		allowRepeat: false,
	} as const satisfies Action['options'];
	if (typeof rawCallback === 'object') {
		const { callback, ...rawOptions } = rawCallback;
		const options = { ...defaultOptions, ...rawOptions };
		return { ...options } as const satisfies Action['options'];
	}
	return { ...defaultOptions } as const satisfies Action['options'];
};

const matchPatterns = (ev: KeyboardEvent, patterns: Action['patterns'], options: Action['options']) => {
	if (ev.repeat && !options.allowRepeat) return false;
	const key = ev.key.toLowerCase();
	return patterns.some(({ which, ctrl, shift, alt }) => {
		if (!which.includes(key)) return false;
		if (ctrl !== (ev.ctrlKey || ev.metaKey)) return false;
		if (alt !== ev.altKey) return false;
		if (shift !== ev.shiftKey) return false;
		return true;
	});
};

const parseKeyCode = (input?: string | null) => {
	if (input == null) return [];
	const raw = getValueByKey(KEY_ALIASES, input);
	if (raw == null) return [input];
	if (typeof raw === 'string') return [trimLower(raw)];
	return raw.map(trimLower);
};

const getValueByKey = <
	T extends Record<keyof any, unknown>,
	K extends keyof T | keyof any,
	R extends K extends keyof T ? T[K] : T[keyof T] | undefined,
>(obj: T, key: K) => {
	return obj[key] as R;
};

const trimLower = (str: string) => str.trim().toLowerCase();
//#endregion
