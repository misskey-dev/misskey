import keyCode from './keycode';

const getKeyMap = keymap => Object.keys(keymap).map(input => {
	const result = {} as any;

	const { keyup, keydown } = keymap[input];

	input.split('+').forEach(keyName => {
		switch (keyName.toLowerCase()) {
			case 'ctrl':
			case 'alt':
			case 'shift':
			case 'meta':
				result[keyName] = true;
				break;
			default: {
				result.keyCode = keyCode(keyName);
				if (!Array.isArray(result.keyCode)) result.keyCode = [result.keyCode];
			}
		}
	});

	result.callback = {
		keydown: keydown || keymap[input],
		keyup
	};

	return result;
});

const ignoreElemens = ['input', 'textarea'];

export default {
	install(Vue) {
		Vue.directive('hotkey', {
			bind(el, binding) {
				el._hotkey_global = binding.modifiers.global === true;

				el._keymap = getKeyMap(binding.value);

				el.dataset.reservedKeyCodes = el._keymap.map(key => `'${key.keyCode}'`).join(' ');

				el._keyHandler = e => {
					const reservedKeyCodes = document.activeElement ? ((document.activeElement as any).dataset || {}).reservedKeyCodes || '' : '';
					if (document.activeElement && ignoreElemens.some(el => document.activeElement.matches(el))) return;

					for (const hotkey of el._keymap) {
						if (el._hotkey_global && reservedKeyCodes.includes(`'${e.keyCode}'`)) break;

						const callback = hotkey.keyCode.includes(e.keyCode) &&
							!!hotkey.ctrl === e.ctrlKey &&
							!!hotkey.alt === e.altKey &&
							!!hotkey.shift === e.shiftKey &&
							!!hotkey.meta === e.metaKey &&
							hotkey.callback[e.type];

						if (callback) {
							e.preventDefault();
							e.stopPropagation();
							callback(e);
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
