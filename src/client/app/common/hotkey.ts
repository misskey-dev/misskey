import keyCode from './keycode';
import { concat } from '../../../prelude/array';

type pattern = {
	which: string[];
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
};

type action = {
	patterns: pattern[];

	callback: Function;
};

const getKeyMap = keymap => Object.entries(keymap).map(([patterns, callback]): action => {
	const result = {
		patterns: [],
		callback: callback
	} as action;

	result.patterns = patterns.split('|').map(part => {
		const pattern = {
			which: []
		} as pattern;

		part.trim().split('+').forEach(key => {
			key = key.trim().toLowerCase();
			switch (key) {
				case 'ctrl': pattern.ctrl = true; break;
				case 'alt': pattern.alt = true; break;
				case 'shift': pattern.shift = true; break;
				default: pattern.which = keyCode(key).map(k => k.toLowerCase());
			}
		});

		return pattern;
	});

	return result;
});

const ignoreElemens = ['input', 'textarea'];

export default {
	install(Vue) {
		Vue.directive('hotkey', {
			bind(el, binding) {
				el._hotkey_global = binding.modifiers.global === true;

				const actions = getKeyMap(binding.value);

				// flatten
				const reservedKeys = concat(concat(actions.map(a => a.patterns.map(p => p.which))));

				el.dataset.reservedKeys = reservedKeys.map(key => `'${key}'`).join(' ');

				el._keyHandler = e => {
					const key = e.code.toLowerCase();

					const targetReservedKeys = document.activeElement ? ((document.activeElement as any).dataset || {}).reservedKeys || '' : '';
					if (document.activeElement && ignoreElemens.some(el => document.activeElement.matches(el))) return;

					for (const action of actions) {
						if (el._hotkey_global && targetReservedKeys.includes(`'${key}'`)) break;

						const matched = action.patterns.some(pattern => {
							let matched = pattern.which.includes(key);
							if (pattern.ctrl && !e.ctrlKey) matched = false;
							if (pattern.shift && !e.shiftKey) matched = false;
							if (pattern.alt && !e.altKey) matched = false;

							if (matched) {
								e.preventDefault();
								e.stopPropagation();
								action.callback(e);
								return true;
							} else {
								return false;
							}
						});

						if (matched) {
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
