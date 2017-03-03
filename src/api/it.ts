/**
 * it
 * 楽しいバリデーション
 */

/**
 * Usage Examples
 *
 * const [val, err] = it(x).must.be.a.string().or('asc desc').default('desc').qed();
 * → xは文字列でなければならず、'asc'または'desc'でなければならない。省略された場合のデフォルトは'desc'とする。
 *
 * const [val, err] = it(x).must.be.a.number().required().range(0, 100).qed();
 * → xは数値でなければならず、かつ0~100の範囲内でなければならない。この値は省略することはできない。
 *
 * const [val, err] = it(x).must.be.an.array().unique().required().validate(x => x[0] != 'strawberry pasta').qed();
 * → xは配列でなければならず、かつ中身が重複していてはならない。この値を省略することはできない。そして配列の最初の要素が'strawberry pasta'という文字列であってはならない。
 *
 * ・意味的に矛盾するので、required と default は併用できません。
 *
 * ~糖衣構文~
 * const [val, err] = it(x).must.be.a.string().required().qed();
 * は
 * const [val, err] = it(x, 'string', true);
 * と書けます
 *
 * ~BDD風記法~
 * must.be.a(n) の代わりに　expect とも書けます:
 * const [val, err] = it(x).expect.string().required().qed();
 */

/**
 * null と undefined の扱い
 *
 * 「値が null または undefined」な状態を「値が空である」と表現しています。
 * 値が空である場合、バリデータやその他の処理メソッドは呼ばれません。
 *
 * 内部的には null と undefined を次のように区別しています:
 * null ... 値が「無い」と明示されている
 * undefined ... 値を指定していない
 *
 * 例えばアカウントのプロフィールを更新するAPIに次のデータを含むリクエストが来たとします:
 * { name: 'Alice' }
 * アカウントには本来、他にも birthday といったフィールドがありますが、
 * このリクエストではそれに触れず、ただ単に name フィールドを更新することを要求しています。
 * ここで、このリクエストにおける birthday フィールドは undefined なわけですが、
 * それはnull(=birthdayを未設定にしたい)とは違うものです。
 * undefined も null も区別しないとしたら、触れていないフィールドまでリセットされることになってしまいます。
 * ですので、undefined と null は区別しています。
 *
 * 明示的に null を許可しない限り、null はエラーになります。
 * null を許可する場合は nullable をプリフィックスします:
 * const [val, err] = it(x).must.be.a.nullable.string().required().qed();
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

	constructor(value: any, nullable: boolean = false) {
		if (value === null && !nullable) {
			this.value = undefined;
			this.error = new Error('must-be-not-a-null');
		} else {
			this.value = value;
			this.error = null;
		}
	}

	get isUndefined() {
		return this.value === undefined;
	}

	get isNull() {
		return this.value === null;
	}

	get isEmpty() {
		return this.isUndefined || this.isNull;
	}

	/**
	 * このインスタンスの値が空、またはエラーが存在しているなどして、処理をスキップするべきか否か
	 */
	get shouldSkip() {
		return this.error !== null || this.isEmpty;
	}

	/**
	 * このインスタンスの値が指定されていない(=undefined)ときにエラーにします
	 */
	required() {
		if (this.error === null && this.isUndefined) {
			this.error = new Error('required');
		}
		return this;
	}

	/**
	 * このインスタンスの値が設定されていない(=undefined)ときにデフォルトで設定する値を設定します
	 */
	default(value: any) {
		if (this.isUndefined) {
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
		if (this.shouldSkip) return this;
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

	constructor(value: any, nullable: boolean = false) {
		super(value, nullable);
		if (!this.isEmpty && typeof value != 'boolean') {
			this.error = new Error('must-be-a-boolean');
		}
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

	constructor(value: any, nullable: boolean = false) {
		super(value, nullable);
		if (!this.isEmpty && !Number.isFinite(value)) {
			this.error = new Error('must-be-a-number');
		}
	}

	/**
	 * 値が指定された範囲内にない場合エラーにします
	 * @param min 下限
	 * @param max 上限
	 */
	range(min: number, max: number) {
		if (this.shouldSkip) return this;
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
		if (this.shouldSkip) return this;
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
		if (this.shouldSkip) return this;
		if (this.value > value) {
			this.error = new Error('invalid-range');
		}
		return this;
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

	constructor(value: any, nullable: boolean = false) {
		super(value, nullable);
		if (!this.isEmpty && typeof value != 'string') {
			this.error = new Error('must-be-a-string');
		}
	}

	/**
	 * 文字数が指定された範囲内にない場合エラーにします
	 * @param min 下限
	 * @param max 上限
	 */
	range(min: number, max: number) {
		if (this.shouldSkip) return this;
		if (this.value.length < min || this.value.length > max) {
			this.error = new Error('invalid-range');
		}
		return this;
	}

	trim() {
		if (this.shouldSkip) return this;
		this.value = this.value.trim();
		return this;
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
		if (this.shouldSkip) return this;
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
		if (this.shouldSkip) return this;
		if (!pattern.test(this.value)) this.error = new Error('not-match-pattern');
		return this;
	}
}

class ArrayQuery extends QueryCore {
	value: any[];
	error: Error;

	constructor(value: any, nullable: boolean = false) {
		super(value, nullable);
		if (!this.isEmpty && !Array.isArray(value)) {
			this.error = new Error('must-be-an-array');
		}
	}

	/**
	 * 配列の値がユニークでない場合(=重複した項目がある場合)エラーにします
	 */
	unique() {
		if (this.shouldSkip) return this;
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
		if (this.shouldSkip) return this;
		if (this.value.length < min || this.value.length > max) {
			this.error = new Error('invalid-range');
		}
		return this;
	}

	/**
	 * このインスタンスの配列内の要素すべてが文字列であるか検証します
	 * ひとつでも文字列以外の要素が存在する場合エラーにします
	 */
	allString() {
		if (this.shouldSkip) return this;
		if (this.value.some(x => typeof x != 'string')) {
			this.error = new Error('dirty-array');
		}
		return this;
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

	constructor(value: any, nullable: boolean = false) {
		super(value, nullable);
		if (!this.isEmpty && (typeof value != 'string' || !mongo.ObjectID.isValid(value))) {
			this.error = new Error('must-be-an-id');
		}
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
	qed(): [mongo.ObjectID, Error] {
		return super.qed();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<mongo.ObjectID>) {
		return super.validate(validator);
	}
}

class ObjectQuery extends QueryCore {
	value: any;
	error: Error;

	constructor(value: any, nullable: boolean = false) {
		super(value, nullable);
		if (!this.isEmpty && typeof value != 'object') {
			this.error = new Error('must-be-an-object');
		}
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
				nullable: {
					string: () => StringQuery;
					number: () => NumberQuery;
					boolean: () => BooleanQuery;
					id: () => IdQuery;
					array: () => ArrayQuery;
					object: () => ObjectQuery;
				};
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
		nullable: {
			string: () => StringQuery;
			number: () => NumberQuery;
			boolean: () => BooleanQuery;
			id: () => IdQuery;
			array: () => ArrayQuery;
			object: () => ObjectQuery;
		};
	};
};

const it = (value: any) => ({
	must: {
		be: {
			a: {
				string: () => new StringQuery(value),
				number: () => new NumberQuery(value),
				boolean: () => new BooleanQuery(value),
				nullable: {
					string: () => new StringQuery(value, true),
					number: () => new NumberQuery(value, true),
					boolean: () => new BooleanQuery(value, true),
					id: () => new IdQuery(value, true),
					array: () => new ArrayQuery(value, true),
					object: () => new ObjectQuery(value, true)
				}
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
		object: () => new ObjectQuery(value),
		nullable: {
			string: () => new StringQuery(value, true),
			number: () => new NumberQuery(value, true),
			boolean: () => new BooleanQuery(value, true),
			id: () => new IdQuery(value, true),
			array: () => new ArrayQuery(value, true),
			object: () => new ObjectQuery(value, true)
		}
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
