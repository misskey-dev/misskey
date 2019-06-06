import keyCode from './keycode';
import { concat } from '../../../prelude/array';

const hotkeyGlobal = Symbol();
const misskeyReservedKeys = Symbol();
const keyHandler = Symbol();

type Pattern = {
	which: string[];
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
};

type Action = {
	patterns: Pattern[];
	callback(e: KeyboardEvent): void;
};

const getKeyMap = (keymap: unknown) => typeof keymap === 'object' && keymap ? Object.entries(keymap as Record<string, Action['callback']>).map(([patterns, callback]): Action => {
	const result: Action = {
		patterns: [],
		callback
	};

	result.patterns = patterns.split('|').map(part => {
		const pattern: Pattern = {
			which: [],
			ctrl: false,
			alt: false,
			shift: false
		};

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
}) : [];

const ignoreElemens = ['input', 'textarea'];

function match(e: KeyboardEvent, patterns: Action['patterns']): boolean {
	const key = e.code.toLowerCase();
	return patterns.some(pattern => pattern.which.includes(key) &&
		pattern.ctrl == e.ctrlKey &&
		pattern.shift == e.shiftKey &&
		pattern.alt == e.altKey &&
		!e.metaKey
	);
}

type DirectiveBinding = {
	name: string;
	value?: unknown;
	oldValue?: unknown;
	expression?: unknown;
	arg?: string;
	oldArg?: string;
	readonly modifiers: Record<string, boolean>;
};

type DirectiveFunction = (el: HTMLElement, binding: DirectiveBinding, vnode: unknown, oldVnode: unknown) => void;

type DirectiveOptions = Partial<Record<'bind' | 'inserted' | 'update' | 'componentUpdated' | 'unbind', DirectiveFunction>>;

type Vue = {
	directive(id: string, definition?: DirectiveOptions | DirectiveFunction): DirectiveOptions
};

export default {
	install(Vue: Vue) {
		Vue.directive('hotkey', {
			bind(el, binding) {
				el[hotkeyGlobal] = binding.modifiers.global === true;

				const actions = getKeyMap(binding.value);

				// flatten
				const reservedKeys = concat(actions.map(a => a.patterns));

				el[misskeyReservedKeys] = reservedKeys;

				el[keyHandler] = (e: KeyboardEvent) => {
					const targetReservedKeys = document.activeElement ? (document.activeElement[misskeyReservedKeys] || []) : [];
					if (document.activeElement && ignoreElemens.some(el => document.activeElement.matches(el))) return;

					for (const action of actions) {
						const matched = match(e, action.patterns);

						if (matched) {
							if (el[hotkeyGlobal] && match(e, targetReservedKeys)) return;

							e.preventDefault();
							e.stopPropagation();
							action.callback(e);
							break;
						}
					}
				};

				if (el[hotkeyGlobal]) {
					document.addEventListener('keydown', el[keyHandler]);
				} else {
					el.addEventListener('keydown', el[keyHandler]);
				}
			},

			unbind(el) {
				if (el[hotkeyGlobal]) {
					document.removeEventListener('keydown', el[keyHandler]);
				} else {
					el.removeEventListener('keydown', el[keyHandler]);
				}
			}
		});
	}
};
