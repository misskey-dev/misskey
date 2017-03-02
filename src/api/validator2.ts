import * as mongo from 'mongodb';
import hasDuplicates from '../common/has-duplicates';

type Validator<T> = (value: T) => boolean | string;
type Modifier<T> = (value: T) => T;

interface Fuctory {
	get: () => [any, string];

	required: () => Fuctory;

	validate: (validator: Validator<any>) => Fuctory;

	modify: (modifier: Modifier<any>) => Fuctory;
}

class FuctoryCore implements Fuctory {
	value: any;
	error: string;

	constructor() {
		this.value = null;
		this.error = null;
	}

	/**
	 * この値が undefined または　null の場合エラーにします
	 */
	required() {
		if (this.error === null && this.value === null) {
			this.error = 'required';
		}
		return this;
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	get(): [any, string] {
		return [this.value, this.error];
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false または(エラーを表す)文字列を返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any>) {
		if (this.error || this.value === null) return this;
		const result = validator(this.value);
		if (result === false) {
			this.error = 'invalid-format';
		} else if (typeof result == 'string') {
			this.error = result;
		}
		return this;
	}

	modify(modifier: Modifier<any>) {
		if (this.error || this.value === null) return this;
		try {
			this.value = modifier(this.value);
		} catch (e) {
			this.error = e;
		}
		return this;
	}
}

class BooleanFuctory extends FuctoryCore {
	value: boolean;
	error: string;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (typeof value != 'boolean') {
			this.error = 'must-be-a-boolean';
		} else {
			this.value = value;
		}
	}

	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	get(): [boolean, string] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false または(エラーを表す)文字列を返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<boolean>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<boolean>) {
		return super.modify(modifier);
	}
}

class NumberFuctory extends FuctoryCore {
	value: number;
	error: string;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (!Number.isFinite(value)) {
			this.error = 'must-be-a-number';
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
			this.error = 'invalid-range';
		}
		return this;
	}

	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	get(): [number, string] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false または(エラーを表す)文字列を返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<number>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<number>) {
		return super.modify(modifier);
	}
}

class StringFuctory extends FuctoryCore {
	value: string;
	error: string;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (typeof value != 'string') {
			this.error = 'must-be-a-string';
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
			this.error = 'invalid-range';
		}
		return this;
	}

	trim() {
		if (this.error || this.value === null) return this;
		this.value = this.value.trim();
		return this;
	}

	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	get(): [string, string] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false または(エラーを表す)文字列を返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<string>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<string>) {
		return super.modify(modifier);
	}
}

class ArrayFuctory extends FuctoryCore {
	value: any[];
	error: string;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (!Array.isArray(value)) {
			this.error = 'must-be-an-array';
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
			this.error = 'must-be-unique';
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
			this.error = 'invalid-range';
		}
		return this;
	}

	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	get(): [any[], string] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false または(エラーを表す)文字列を返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any[]>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<any[]>) {
		return super.modify(modifier);
	}
}

class IdFuctory extends FuctoryCore {
	value: mongo.ObjectID;
	error: string;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (typeof value != 'string' || !mongo.ObjectID.isValid(value)) {
			this.error = 'must-be-an-id';
		} else {
			this.value = new mongo.ObjectID(value);
		}
	}

	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	get(): [any[], string] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false または(エラーを表す)文字列を返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any[]>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<any[]>) {
		return super.modify(modifier);
	}
}

class ObjectFuctory extends FuctoryCore {
	value: any;
	error: string;

	constructor(value) {
		super();
		if (value === undefined || value === null) {
			this.value = null;
		} else if (typeof value != 'object') {
			this.error = 'must-be-an-object';
		} else {
			this.value = value;
		}
	}

	required() {
		return super.required();
	}

	/**
	 * このインスタンスの値およびエラーを取得します
	 */
	get(): [any, string] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false または(エラーを表す)文字列を返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<any>) {
		return super.modify(modifier);
	}
}

const it = (value: any) => ({
	must: {
		be: {
			a: {
				string: () => new StringFuctory(value),
				number: () => new NumberFuctory(value),
				boolean: () => new BooleanFuctory(value)
			},
			an: {
				id: () => new IdFuctory(value),
				array: () => new ArrayFuctory(value),
				object: () => new ObjectFuctory(value)
			}
		}
	}
});

export default it;

const [n, e] = it(42).must.be.a.number().required().range(10, 70).validate(x => x != 21).get();
