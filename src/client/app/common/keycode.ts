export default searchInput => {
	// Keyboard Events
	if (searchInput && typeof searchInput === 'object') {
		const hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode;
		if (hasKeyCode) {
			searchInput = hasKeyCode;
		}
	}

	// Numbers
	// if (typeof searchInput === 'number') {
	//   return names[searchInput]
	// }

	// Everything else (cast to string)
	const search = String(searchInput);

	// check codes
	const foundNamedKeyCodes = codes[search.toLowerCase()];
	if (foundNamedKeyCodes) {
		return foundNamedKeyCodes;
	}

	// check aliases
	const foundNamedKeyAliases = aliases[search.toLowerCase()];
	if (foundNamedKeyAliases) {
		return foundNamedKeyAliases;
	}

	// weird character?
	if (search.length === 1) {
		return search.charCodeAt(0);
	}

	return undefined;
};

/**
 * Get by name
 *
 *   exports.code['enter'] // => 13
 */

export const codes = {
	'backspace': 8,
	'tab': 9,
	'enter': 13,
	'shift': 16,
	'ctrl': 17,
	'alt': 18,
	'pause/break': 19,
	'caps lock': 20,
	'esc': 27,
	'space': 32,
	'page up': 33,
	'page down': 34,
	'end': 35,
	'home': 36,
	'left': 37,
	'up': 38,
	'right': 39,
	'down': 40,
	// 'add': 43,
	'insert': 45,
	'delete': 46,
	'command': 91,
	'left command': 91,
	'right command': 93,
	'numpad *': 106,
	'numpad plus': [43, 107],
	'numpad add': 43, // as a trick
	'numpad -': 109,
	'numpad .': 110,
	'numpad /': 111,
	'num lock': 144,
	'scroll lock': 145,
	'my computer': 182,
	'my calculator': 183,
	';': 186,
	'=': 187,
	',': 188,
	'-': 189,
	'.': 190,
	'/': 191,
	'`': 192,
	'[': 219,
	'\\': 220,
	']': 221,
	"'": 222
};

// Helper aliases

export const aliases = {
	'windows': 91,
	'⇧': 16,
	'⌥': 18,
	'⌃': 17,
	'⌘': 91,
	'ctl': 17,
	'control': 17,
	'option': 18,
	'pause': 19,
	'break': 19,
	'caps': 20,
	'return': 13,
	'escape': 27,
	'spc': 32,
	'pgup': 33,
	'pgdn': 34,
	'ins': 45,
	'del': 46,
	'cmd': 91
};

/*!
* Programatically add the following
*/

// lower case chars
for (let i = 97; i < 123; i++) {
	codes[String.fromCharCode(i)] = i - 32;
}

// numbers
for (let i = 48; i < 58; i++) {
	codes[i - 48] = i;
}

// function keys
for (let i = 1; i < 13; i++) {
	codes['f' + i] = i + 111;
}

// numpad keys
for (let i = 0; i < 10; i++) {
	codes['numpad ' + i] = i + 96;
}
