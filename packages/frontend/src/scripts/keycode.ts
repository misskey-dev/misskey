export default (input: string): string[] => {
	if (Object.keys(aliases).some(a => a.toLowerCase() === input.toLowerCase())) {
		const codes = aliases[input];
		return Array.isArray(codes) ? codes : [codes];
	} else {
		return [input];
	}
};

export const aliases = {
	'esc': 'Escape',
	'enter': ['Enter', 'NumpadEnter'],
	'up': 'ArrowUp',
	'down': 'ArrowDown',
	'left': 'ArrowLeft',
	'right': 'ArrowRight',
	'plus': ['NumpadAdd', 'Semicolon'],
};

/*!
* Programmatically add the following
*/

// lower case chars
for (let i = 97; i < 123; i++) {
	const char = String.fromCharCode(i);
	aliases[char] = `Key${char.toUpperCase()}`;
}

// numbers
for (let i = 0; i < 10; i++) {
	aliases[i] = [`Numpad${i}`, `Digit${i}`];
}
