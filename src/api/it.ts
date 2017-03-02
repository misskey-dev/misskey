import * as mongo from 'mongodb';
import hasDuplicates from '../common/has-duplicates';

type Validator<T> = (value: T) => boolean | Error;

interface Factory {
	/**
	 * qedはQ.E.D.でもあり'QueryENd'の略でもある
	 */
	qed: () => [any, Error];

	required: () => Factory;

	validate: (validator: Validator<any>) => Factory;
}

class FactoryCore implements Factory {
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

class BooleanFactory extends FactoryCore {
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

class NumberFactory extends FactoryCore {
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
	 * このインスタンスの値が undefined または　null の場合エラーにします
	 */
	required() {
		return super.required();
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

class StringFactory extends FactoryCore {
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
}

class ArrayFactory extends FactoryCore {
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

class IdFactory extends FactoryCore {
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

class ObjectFactory extends FactoryCore {
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
				string: () => StringFactory;
				number: () => NumberFactory;
				boolean: () => BooleanFactory;
			};
			an: {
				id: () => IdFactory;
				array: () => ArrayFactory;
				object: () => ObjectFactory;
			};
		};
	};
	expect: {
		string: () => StringFactory;
		number: () => NumberFactory;
		boolean: () => BooleanFactory;
		id: () => IdFactory;
		array: () => ArrayFactory;
		object: () => ObjectFactory;
	};
};

const it = (value: any) => ({
	must: {
		be: {
			a: {
				string: () => new StringFactory(value),
				number: () => new NumberFactory(value),
				boolean: () => new BooleanFactory(value)
			},
			an: {
				id: () => new IdFactory(value),
				array: () => new ArrayFactory(value),
				object: () => new ObjectFactory(value)
			}
		}
	},
	expect: {
		string: () => new StringFactory(value),
		number: () => new NumberFactory(value),
		boolean: () => new BooleanFactory(value),
		id: () => new IdFactory(value),
		array: () => new ArrayFactory(value),
		object: () => new ObjectFactory(value)
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

	let factory: Factory = null;

	switch (type) {
		case 'id': factory = it(value).expect.id(); break;
		case 'string': factory = it(value).expect.string(); break;
		case 'number': factory = it(value).expect.number(); break;
		case 'boolean': factory = it(value).expect.boolean(); break;
		case 'array': factory = it(value).expect.array(); break;
		case 'set': factory = it(value).expect.array().unique(); break;
		case 'object': factory = it(value).expect.object(); break;
	}

	if (isRequired) factory = factory.required();

	if (validator) {
		(Array.isArray(validator) ? validator : [validator])
			.forEach(v => factory = factory.validate(v));
	}

	return factory;
}

export default x;
