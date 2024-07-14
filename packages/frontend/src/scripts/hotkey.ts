/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getHTMLElementOrNull } from "@/scripts/get-dom-node-or-null.js";

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
	'enter': 'Enter',
	'space': ' ',
	'up': 'ArrowUp',
	'down': 'ArrowDown',
	'left': 'ArrowLeft',
	'right': 'ArrowRight',
	'plus': ['+', ';'],
};

const MODIFIER_KEYS = ['ctrl', 'alt', 'shift'];

const IGNORE_ELEMENTS = ['input', 'textarea'];
//#endregion

//#region store
let latestHotkey: Pattern & { callback: CallbackFunction } | null = null;
//#endregion

//#region impl
export const makeHotkey = (keymap: Keymap) => {
	const actions = parseKeymap(keymap);
	return (ev: KeyboardEvent) => {
		if ('pswp' in window && window.pswp != null) return;
		if (document.activeElement != null) {
			if (IGNORE_ELEMENTS.includes(document.activeElement.tagName.toLowerCase())) return;
			if (getHTMLElementOrNull(document.activeElement)?.isContentEditable) return;
		}
		for (const action of actions) {
			if (matchPatterns(ev, action)) {
				ev.preventDefault();
				ev.stopPropagation();
				action.callback(ev);
				storePattern(ev, action.callback);
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

const matchPatterns = (ev: KeyboardEvent, action: Action) => {
	const { patterns, options, callback } = action;
	if (ev.repeat && !options.allowRepeat) return false;
	const key = ev.key.toLowerCase();
	return patterns.some(({ which, ctrl, shift, alt }) => {
		if (
			options.allowRepeat === false &&
			latestHotkey != null &&
			latestHotkey.which.includes(key) &&
			latestHotkey.ctrl === ctrl &&
			latestHotkey.alt === alt &&
			latestHotkey.shift === shift &&
			latestHotkey.callback === callback
		) {
			return false;
		}
		if (!which.includes(key)) return false;
		if (ctrl !== (ev.ctrlKey || ev.metaKey)) return false;
		if (alt !== ev.altKey) return false;
		if (shift !== ev.shiftKey) return false;
		return true;
	});
};

let lastHotKeyStoreTimer: number | null = null;

const storePattern = (ev: KeyboardEvent, callback: CallbackFunction) => {
	if (lastHotKeyStoreTimer != null) {
		clearTimeout(lastHotKeyStoreTimer);
	}

	latestHotkey = {
		which: [ev.key.toLowerCase()],
		ctrl: ev.ctrlKey || ev.metaKey,
		alt: ev.altKey,
		shift: ev.shiftKey,
		callback,
	};

	lastHotKeyStoreTimer = window.setTimeout(() => {
		latestHotkey = null;
	}, 500);
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
