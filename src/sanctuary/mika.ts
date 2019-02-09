/* tslint:enable:strict-type-predicates triple-equals */

import { toEnglishString } from '../prelude/array';

/* KEYWORD DEFINITION
 * { sakura: null } // 'sakura' is null.
 * { izumi: undefined } // 'izumi' is undefined.
 * {} // 'ako' is unprovided (not undefined in here).
 *
 * Reason: The undefined is a type, so you can define undefined.
 */

export const additional = Symbol('Allows additional properties.');
export const optional = Symbol('Allows unprovided (not undefined).');
export const nullable = Symbol('Allows null.');

type Type = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';
type ExtendedType = Type | 'null' | 'unprovided';

type Everything = string | number | bigint | boolean | symbol | undefined | object | Function | null;

/**
 * Manifest
 * Information for
 * Reliance
 * Identify
 * Analysis
 */
type Miria = {
	/** STRING TYPED SYNTAX
	 * type1       : Allows the type1 and null.
	 * type1|type2 : Allows type1, type2, and null.
	 * type1!      : Allows type1 only.
	 * type1?      : Allows type1, null, and unprovided.
	 * type1!?     : Allows type1, and unprovided.
	 *
	 * (! and ? are suffix.)
	 * (The spaces(U+0020) are ignored.)
	 */
	[x: string]: string | Miria;
	[additional]?: boolean;
	[optional]?: boolean;
	[nullable]?: boolean;
};

/**
 * Reason
 * Information for
 * Keeping safety by
 * Analysis
 */
type Rika = {
	path: string;
	excepted: string | Miria | null;
	actual: ExtendedType;
};

type MiriaInternal = {
	[x: string]: string | MiriaInternal | undefined;
	[additional]?: boolean;
	[optional]?: boolean;
	[nullable]?: boolean;
};

const $ = () => {}; // trash

// ^ https://github.com/Microsoft/TypeScript/issues/7061

/**
 * Manifest based
 * Identify objects for
 * Keeping safety by this
 * Analyzer class
 */
export default class Mika {
	private static readonly fuhihi = 'Miria'; // < https://github.com/Microsoft/TypeScript/issues/1579

	protected static readonly types = ['string', 'number', 'bigint', 'boolean', 'symbol', 'undefined', 'object', 'function'];

	protected static readonly syntax = new RegExp(`^\\s*(?:${Mika.types.join('|')})(?:\\s*\\|\\s*(?:${Mika.types.join('|')}))*\\s*!?\\s*\\??\\s*$`);

	public static readonly additional = additional;

	public static readonly optional = optional;

	public static readonly nullable = nullable;

	constructor(
		readonly miria: Miria
	) {
		Mika.ensure(miria, [], Object.keys({ miria })[0]);
		//                     ^~~ #1579 (see above) ~~^
	}

	private static ensure(
		source: Miria,
		location: string[],
		nameof: string
	) {
		const errorMessage = `Specified ${nameof} is invalid.`;

		for (const [k, v] of Object.entries(source)) {
			const invalidType = !['string', 'object'].includes(typeof v);
			const header = () => `${errorMessage} ${[...location, k].join('.')} is`;

			if (invalidType || v === null)
				throw `${header()} ${invalidType ? `${typeof v === 'undefined' ? 'an' : 'a'} ${typeof v}, neither string or object(: ${Mika.fuhihi})` : 'is null'}.`;

			if (typeof v === 'string' && !Mika.syntax.test(v))
				throw `${header()} '${v}', neither ${toEnglishString([...Mika.types, 'combined theirs'], 'or')}.`;

			if (typeof v === 'object')
				this.ensure(v, [...location, k], errorMessage);
		}
	}

	protected static validateFromString(
		target: Everything,
		source: string,
		location: string[] = []
	) {
		const path = location.join('.');
		const rikas: Rika[] = [];
		const excepted = source.replace(/\s/, '');
		/*let it move! v
		*/let lastSpan = excepted.length - 1;
		const optional = excepted[lastSpan] === '?';
		const nullable = excepted[optional ? --lastSpan : lastSpan] !== '!';
		const allowing = excepted.slice(0, nullable ? --lastSpan : lastSpan).split('|');
		const pushRika = (actual: ExtendedType) => rikas.push({ path, excepted, actual });

		if (target === null)
			(nullable || pushRika('null'), $)();
		else if (!allowing.includes(typeof target))
			pushRika(typeof target);

		return rikas;
	}

	protected dive(
		target: object,
		source: MiriaInternal,
		location: string[] = []
	) {
		const rikas: Rika[] = [];
		/** DEFINITION
		 * |   values   | specs | given |
		 * |-----------:|:------|:------|
		 * |       true | true  | true  |
		 * |      false | false | true  |
		 * |       null | true  | false |
		 * | unprovided | false | false |
		 */
		const keys = Object.keys(source).reduce<Record<string, boolean | null>>((a, c) => (a[c] = null, a), {});

		for (const [k, v] of Object.entries(target) as [string, Everything][]) {
			const inclusion = keys[k] !== undefined;
			const x = source[k];
			const miria = x as Miria;
			const here = [...location, k];
			const path = here.join('.');
			const pushRika = (actual: ExtendedType, excepted?: string | Miria | null) => rikas.push({
				path,
				excepted: excepted === undefined ? miria : excepted,
				actual
			});
			const pushRikas = (iterable: Iterable<Rika>) => {
				for (const rika of iterable)
					rikas.push(rika);
			};

			keys[k] = inclusion;

			if (!inclusion && !source[additional])
				pushRika(v === null ? 'null' : typeof v, null);
			else if (typeof x === 'undefined')
				continue;
			else if (typeof x === 'string')
				pushRikas(Mika.validateFromString(v, x, here));
			else if (v === undefined)
				(x[optional] || pushRika(inclusion ? 'undefined' : 'unprovided'), $)();
			else if (v === null)
				(x[nullable] || pushRika('null'), $)();
			else if (typeof v === 'object')
				pushRikas(this.dive(v, x, here));
			else
				pushRika(typeof v);
		}

		for (const [k, v] of Object.entries(source as Miria).filter(([k]) => keys[k] === null)) {
			const rika: Rika = {
				path: [...location, k].join('.'),
				excepted: v,
				actual: 'unprovided'
			};

			if (typeof v === 'string')
				(v.endsWith('?') || rikas.push(rika), $)();
			else if (!v[optional])
				rikas.push(rika);
		}

		return rikas;
	}

	/**
	 * Validates object.
	 * @param x The source object.
	 * @returns The difference points when the source object fails validation, otherwise null.
	 */
	public validate(
		x: object
	) {
		const root = (actual: ExtendedType): Rika[] => [{
			path: '',
			excepted: this.miria,
			actual
		}];

		if (typeof x !== 'object')
			return root(typeof x);

		if (x === null)
			return this.miria[nullable] ? null : root('null');

		const rikas = this.dive(x, this.miria);

		return rikas.length ? rikas : null;
	}
}
