import keyCode from './keycode';
import { concat } from '../../prelude/array';

type pattern = {
	which: string[];
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
};

type action = {
	patterns: pattern[];

	callback: Function;

	allowRepeat: boolean;
};

const getKeyMap = keymap => Object.entries(keymap).map(([patterns, callback]): action => {
	const result = {
		patterns: [],
		callback: callback,
		allowRepeat: true
	} as action;

	if (patterns.match(/^\(.*\)$/) !== null) {
		result.allowRepeat = false;
		patterns = patterns.slice(1, -1);
	}

	console.log(patterns);

	result.patterns = patterns.split('|').map(part => {
		const pattern = {
			which: [],
			ctrl: false,
			alt: false,
			shift: false
		} as pattern;

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

const ignoreElemens = ['input', 'textarea'];

function match(e: KeyboardEvent, patterns: action['patterns']): boolean {
	const key = e.code.toLowerCase();
	return patterns.some(pattern => pattern.which.includes(key) &&
		pattern.ctrl == e.ctrlKey &&
		pattern.shift == e.shiftKey &&
		pattern.alt == e.altKey &&
		!e.metaKey
	);
}

export default {
	install(Vue) {
		Vue.directive('hotkey', {
			bind(el, binding) {
				el._hotkey_global = binding.modifiers.global === true;

				const actions = getKeyMap(binding.value);

				// flatten
				const reservedKeys = concat(actions.map(a => a.patterns));

				el._misskey_reservedKeys = reservedKeys;

				el._keyHandler = (e: KeyboardEvent) => {
					const targetReservedKeys = document.activeElement ? ((document.activeElement as any)._misskey_reservedKeys || []) : [];
					if (document.activeElement && ignoreElemens.some(el => document.activeElement.matches(el))) return;

					for (const action of actions) {
						const matched = match(e, action.patterns);

						if (matched) {
							if (!action.allowRepeat && e.repeat) return;
							if (el._hotkey_global && match(e, targetReservedKeys)) return;

							e.preventDefault();
							e.stopPropagation();
							action.callback(e);
							break;
						}
					}
				};

				if (el._hotkey_global) {
					document.addEventListener('keydown', el._keyHandler);
				} else {
					el.addEventListener('keydown', el._keyHandler);
				}
			},

			unbind(el) {
				if (el._hotkey_global) {
					document.removeEventListener('keydown', el._keyHandler);
				} else {
					el.removeEventListener('keydown', el._keyHandler);
				}
			}
		});
	}
};
