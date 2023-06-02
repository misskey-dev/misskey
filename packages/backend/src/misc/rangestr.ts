export type Options = {
	ellipsis?: string | string[];
	keepOrder?: boolean;
};

const defaultOptions: Options = {
	ellipsis: [
		'-',
		'~',
		'..',
		'...',
	],
	keepOrder: true,
};

function parse(source: string, options?: Options): string[] {
	const opts = options ?? {};
	const keepOrder = opts.keepOrder !== undefined ? opts.keepOrder : defaultOptions.keepOrder;
	const ellipsis = opts.ellipsis ?? defaultOptions.ellipsis;
	const ellipsises = Array.isArray(ellipsis) ? ellipsis : [ellipsis];
	ellipsises.sort((a, b) => a!.length < b!.length ? 1 : -1);

	const chars: string[] = [];

	for (let i = 0; i < source.length; i++) {
		if (source[i] === '\\') {
			chars.push(source[i + 1]);
			i++;
			continue;
		}

		const matched = ellipsises.some(ellipsis => {
			if (source.substr(i + 1, ellipsis!.length) === ellipsis && source[i + 1 + ellipsis.length] !== undefined) {
				const begin = source[i];
				const end = source[i + 1 + ellipsis.length];
				Array.prototype.push.apply(chars, iterate(begin, end, keepOrder));
				i += 1 + ellipsis.length;
				return true;
			} else {
				return false;
			}
		});

		if (!matched) {
			chars.push(source[i]);
		}
	}

	return chars;
}

function iterate(begin: string, end: string, keepOrder = true): string[] {
	const chars: string[] = [];

	const beginCharCode = begin.charCodeAt(0);
	const endCharCode = end.charCodeAt(0);
	const order = beginCharCode < endCharCode;
	const min = order ? beginCharCode : endCharCode;
	const max = order ? endCharCode : beginCharCode;

	for (let i = min; i <= max; i++) {
		chars.push(String.fromCharCode(i));
	}

	return keepOrder
		? order ? chars : chars.reverse()
		: chars;
}

export default function rangestr(source: string, options?: Options): string[];
export default function rangestr(begin: string, end: string): string[];

export default function rangestr(x: string, y?: any): string[] {
	if (typeof y === 'undefined') {
		return parse(x);
	} else if (typeof y === 'string') {
		return iterate(x, y);
	} else {
		return parse(x, y);
	}
}
