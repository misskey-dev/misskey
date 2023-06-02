import rangestr from './rangestr.js';

export type Chars = string | string[];

export type Options = {
	length?: number;
	chars?: Chars;
	parseRange?: boolean;
};

const defaultOptions: Options = {
	length: 64,
	chars: 'a-z0-9',
	parseRange: true,
};

function generate(options?: Options): string {
	const opts = options ?? {};

	const length = opts.length ?? defaultOptions.length;
	const parseRange = opts.parseRange !== undefined ? opts.parseRange : defaultOptions.parseRange;
	const chars = opts.chars
		? Array.isArray(opts.chars)
			? opts.chars
			: parseRange
				? rangestr(<string>opts.chars)
				: (<string>opts.chars).split('')
		: rangestr(<string>defaultOptions.chars);
	const random = Math.random;

	let str = '';

	for (let i = 0; i < length!; i++) {
		str += chars[Math.floor(random() * chars.length)];
	}

	return str;
}

export default function rndstr(): string;
export default function rndstr(options: Options): string;
export default function rndstr(chars: Chars): string;
export default function rndstr(length: number): string;
export default function rndstr(chars: Chars, length: number): string;
export default function rndstr(chars: Chars, length: number, seed: string | number): string;

export default function rndstr(x?: any, y?: any, z?: any): string {
	if (typeof x === 'undefined') {
		return generate();
	} else if (typeof x === 'number') {
		return generate({
			length: x,
		});
	} else if (typeof x === 'string' || Array.isArray(x)) {
		if (typeof y === 'number') {
			if (typeof z === 'string' || typeof z === 'number') {
				return generate({
					chars: x,
					length: y,
				});
			} else {
				return generate({
					chars: x,
					length: y,
				});
			}
		} else {
			return generate({
				chars: x,
			});
		}
	} else {
		return generate(x);
	}
}
