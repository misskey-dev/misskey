/**
 * it
 * 楽しいバリデーション
 */

import * as mongo from 'mongodb';
import hasDuplicates from '../common/has-duplicates';

type Validator<T> = (value: T) => boolean | Error;

interface Query {
	/**
	 * qedはQ.E.D.でもあり'QueryEnD'の略でもある
	 */
	qed: () => [any, Error];

	required: () => Query;

	default: (value: any) => Query;

	validate: (validator: Validator<any>) => Query;
}

class QueryCore implements Query {
	value: any;
	error: Error;

	constructor() {
		this.value = null;
		this.error = null;
	}

	/**
	 * このインスタンスの値が undefined または　null の場合エラーにします
	 */
	required() {
		if (this.error === null && this.value === null) {
			this.error = new Error('required');
		}
		return this;
	}

	/**
	 * このインスタンスの値が設定されていないときにデフォルトで設定する値を設定します
	 */
	default(value: any) {
		if (this.value === null) {
			this.value = value;
		}
		return this;
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	qed(): [any, Error] {
		return [this.value, this.error];
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any>) {
		if (this.error || this.value === null) return this;
		const result = validator(this.value);
		if (result === false) {
			this.error = new Error('invalid-format');
		} else if (result instanceof Error) {
			this.error = result;
		}
		return this;
	}
}

class BooleanQuery extends QueryCore {
	value: boolean;
	error: Error;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (typeof value != 'boolean') {
			this.error = new Error('must-be-a-boolean');
		} else {
			this.value = value;
		}
	}

	/**
	 * このインスタンスの値が undefined または　null の場合エラーにします
	 */
	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値が設定されていないときにデフォルトで設定する値を設定します
	 */
	default(value: boolean) {
		return super.default(value);
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	qed(): [boolean, Error] {
		return super.qed();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<boolean>) {
		return super.validate(validator);
	}
}

class NumberQuery extends QueryCore {
	value: number;
	error: Error;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (!Number.isFinite(value)) {
			this.error = new Error('must-be-a-number');
		} else {
			this.value = value;
		}
	}

	/**
	 * 値が指定された範囲内にない場合エラーにします
	 * @param min 下限
	 * @param max 上限
	 */
	range(min: number, max: number) {
		if (this.error || this.value === null) return this;
		if (this.value < min || this.value > max) {
			this.error = new Error('invalid-range');
		}
		return this;
	}

	/**
	 * このインスタンスの値が指定された下限より下回っている場合エラーにします
	 * @param value 下限
	 */
	min(value: number) {
		if (this.error || this.value === null) return this;
		if (this.value < value) {
			this.error = new Error('invalid-range');
		}
		return this;
	}

	/**
	 * このインスタンスの値が指定された上限より上回っている場合エラーにします
	 * @param value 上限
	 */
	max(value: number) {
		if (this.error || this.value === null) return this;
		if (this.value > value) {
			this.error = new Error('invalid-range');
		}
		return this;
	}

	/**
	 * このインスタンスの値が undefined または　null の場合エラーにします
	 */
	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値が設定されていないときにデフォルトで設定する値を設定します
	 */
	default(value: number) {
		return super.default(value);
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	qed(): [number, Error] {
		return super.qed();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<number>) {
		return super.validate(validator);
	}
}

class StringQuery extends QueryCore {
	value: string;
	error: Error;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (typeof value != 'string') {
			this.error = new Error('must-be-a-string');
		} else {
			this.value = value;
		}
	}

	/**
	 * 文字数が指定された範囲内にない場合エラーにします
	 * @param min 下限
	 * @param max 上限
	 */
	range(min: number, max: number) {
		if (this.error || this.value === null) return this;
		if (this.value.length < min || this.value.length > max) {
			this.error = new Error('invalid-range');
		}
		return this;
	}

	trim() {
		if (this.error || this.value === null) return this;
		this.value = this.value.trim();
		return this;
	}

	/**
	 * このインスタンスの値が undefined または　null の場合エラーにします
	 */
	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値が設定されていないときにデフォルトで設定する値を設定します
	 */
	default(value: string) {
		return super.default(value);
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	qed(): [string, Error] {
		return super.qed();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<string>) {
		return super.validate(validator);
	}

	/**
	 * このインスタンスの文字列が、与えられたパターン内の文字列のどれかと一致するか検証します
	 * どれとも一致しない場合エラーにします
	 * @param pattern 文字列の配列またはスペースで区切られた文字列
	 */
	or(pattern: string | string[]) {
		if (this.error || this.value === null) return this;
		if (typeof pattern == 'string') pattern = pattern.split(' ');
		const match = pattern.some(x => x === this.value);
		if (!match) this.error = new Error('not-match-pattern');
		return this;
	}

	/**
	 * このインスタンスの文字列が、与えられた正規表現と一致するか検証します
	 * 一致しない場合エラーにします
	 * @param pattern 正規表現
	 */
	match(pattern: RegExp) {
		if (this.error || this.value === null) return this;
		if (!pattern.test(this.value)) this.error = new Error('not-match-pattern');
		return this;
	}
}

class ArrayQuery extends QueryCore {
	value: any[];
	error: Error;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (!Array.isArray(value)) {
			this.error = new Error('must-be-an-array');
		} else {
			this.value = value;
		}
	}

	/**
	 * 配列の値がユニークでない場合(=重複した項目がある場合)エラーにします
	 */
	unique() {
		if (this.error || this.value === null) return this;
		if (hasDuplicates(this.value)) {
			this.error = new Error('must-be-unique');
		}
		return this;
	}

	/**
	 * 配列の長さが指定された範囲内にない場合エラーにします
	 * @param min 下限
	 * @param max 上限
	 */
	range(min: number, max: number) {
		if (this.error || this.value === null) return this;
		if (this.value.length < min || this.value.length > max) {
			this.error = new Error('invalid-range');
		}
		return this;
	}

	/**
	 * このインスタンスの値が undefined または　null の場合エラーにします
	 */
	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値が設定されていないときにデフォルトで設定する値を設定します
	 */
	default(value: any[]) {
		return super.default(value);
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	qed(): [any[], Error] {
		return super.qed();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any[]>) {
		return super.validate(validator);
	}
}

class IdQuery extends QueryCore {
	value: mongo.ObjectID;
	error: Error;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (typeof value != 'string' || !mongo.ObjectID.isValid(value)) {
			this.error = new Error('must-be-an-id');
		} else {
			this.value = new mongo.ObjectID(value);
		}
	}

	/**
	 * このインスタンスの値が undefined または　null の場合エラーにします
	 */
	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値が設定されていないときにデフォルトで設定する値を設定します
	 */
	default(value: mongo.ObjectID) {
		return super.default(value);
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	qed(): [any[], Error] {
		return super.qed();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any[]>) {
		return super.validate(validator);
	}
}

class ObjectQuery extends QueryCore {
	value: any;
	error: Error;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (typeof value != 'object') {
			this.error = new Error('must-be-an-object');
		} else {
			this.value = value;
		}
	}

	/**
	 * このインスタンスの値が undefined または　null の場合エラーにします
	 */
	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値が設定されていないときにデフォルトで設定する値を設定します
	 */
	default(value: any) {
		return super.default(value);
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	qed(): [any, Error] {
		return super.qed();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any>) {
		return super.validate(validator);
	}
}

type It = {
	must: {
		be: {
			a: {
				string: () => StringQuery;
				number: () => NumberQuery;
				boolean: () => BooleanQuery;
			};
			an: {
				id: () => IdQuery;
				array: () => ArrayQuery;
				object: () => ObjectQuery;
			};
		};
	};
	expect: {
		string: () => StringQuery;
		number: () => NumberQuery;
		boolean: () => BooleanQuery;
		id: () => IdQuery;
		array: () => ArrayQuery;
		object: () => ObjectQuery;
	};
};

const it = (value: any) => ({
	must: {
		be: {
			a: {
				string: () => new StringQuery(value),
				number: () => new NumberQuery(value),
				boolean: () => new BooleanQuery(value)
			},
			an: {
				id: () => new IdQuery(value),
				array: () => new ArrayQuery(value),
				object: () => new ObjectQuery(value)
			}
		}
	},
	expect: {
		string: () => new StringQuery(value),
		number: () => new NumberQuery(value),
		boolean: () => new BooleanQuery(value),
		id: () => new IdQuery(value),
		array: () => new ArrayQuery(value),
		object: () => new ObjectQuery(value)
	}
});

type Type = 'id' | 'string' | 'number' | 'boolean' | 'array' | 'set' | 'object';

function x(value: any): It;
function x(value: any, type: 'id', isRequired?: boolean, validator?: Validator<mongo.ObjectID> | Validator<mongo.ObjectID>[]): [mongo.ObjectID, Error];
function x(value: any, type: 'string', isRequired?: boolean, validator?: Validator<string> | Validator<string>[]): [string, Error];
function x(value: any, type: 'number', isRequired?: boolean, validator?: Validator<number> | Validator<number>[]): [number, Error];
function x(value: any, type: 'boolean', isRequired?: boolean): [boolean, Error];
function x(value: any, type: 'array', isRequired?: boolean, validator?: Validator<any[]> | Validator<any[]>[]): [any[], Error];
function x(value: any, type: 'set', isRequired?: boolean, validator?: Validator<any[]> | Validator<any[]>[]): [any[], Error];
function x(value: any, type: 'object', isRequired?: boolean, validator?: Validator<any> | Validator<any>[]): [any, Error];
function x(value: any, type?: Type, isRequired?: boolean, validator?: Validator<any> | Validator<any>[]): any {
	if (typeof type === 'undefined') return it(value);

	let q: Query = null;

	switch (type) {
		case 'id': q = it(value).expect.id(); break;
		case 'string': q = it(value).expect.string(); break;
		case 'number': q = it(value).expect.number(); break;
		case 'boolean': q = it(value).expect.boolean(); break;
		case 'array': q = it(value).expect.array(); break;
		case 'set': q = it(value).expect.array().unique(); break;
		case 'object': q = it(value).expect.object(); break;
	}

	if (isRequired) q = q.required();

	if (validator) {
		(Array.isArray(validator) ? validator : [validator])
			.forEach(v => q = q.validate(v));
	}

	return q;
}

export default x;
