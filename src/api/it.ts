import * as mongo from 'mongodb';
import hasDuplicates from '../common/has-duplicates';

type Validator<T> = (value: T) => boolean | Error;
type Modifier<T> = (value: T) => T;

interface Factory {
	get: () => [any, Error];

	required: () => Factory;

	validate: (validator: Validator<any>) => Factory;

	modify: (modifier: Modifier<any>) => Factory;
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
	get(): [any, Error] {
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
	get(): [boolean, Error] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<boolean>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<boolean>) {
		return super.modify(modifier);
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
	get(): [number, Error] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<number>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<number>) {
		return super.modify(modifier);
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
	get(): [string, Error] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<string>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<string>) {
		return super.modify(modifier);
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
	get(): [any[], Error] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any[]>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<any[]>) {
		return super.modify(modifier);
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
	get(): [any[], Error] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any[]>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<any[]>) {
		return super.modify(modifier);
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
	get(): [any, Error] {
		return super.get();
	}

	/**
	 * このインスタンスの値に対して妥当性を検証します
	 * バリデータが false またはエラーを返した場合エラーにします
	 * @param validator バリデータ
	 */
	validate(validator: Validator<any>) {
		return super.validate(validator);
	}

	modify(modifier: Modifier<any>) {
		return super.modify(modifier);
	}
}

type MustBe = {
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
};

const mustBe = (value: any) => ({
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
	}
});

type Type = 'id' | 'string' | 'number' | 'boolean' | 'array' | 'set' | 'object';
type Pipe<T> = (x: T) => T | boolean | Error;

function validate(value: any, type: 'id', isRequired?: boolean, pipe?: Pipe<mongo.ObjectID> | Pipe<mongo.ObjectID>[]): [mongo.ObjectID, Error];
function validate(value: any, type: 'string', isRequired?: boolean, pipe?: Pipe<string> | Pipe<string>[]): [string, Error];
function validate(value: any, type: 'number', isRequired?: boolean, pipe?: Pipe<number> | Pipe<number>[]): [number, Error];
function validate(value: any, type: 'boolean', isRequired?: boolean): [boolean, Error];
function validate(value: any, type: 'array', isRequired?: boolean, pipe?: Pipe<any[]> | Pipe<any[]>[]): [any[], Error];
function validate(value: any, type: 'set', isRequired?: boolean, pipe?: Pipe<any[]> | Pipe<any[]>[]): [any[], Error];
function validate(value: any, type: 'object', isRequired?: boolean, pipe?: Pipe<any> | Pipe<any>[]): [any, Error];
function validate(value: any, type: Type, isRequired?: boolean, pipe?: Pipe<any> | Pipe<any>[]): [any, Error] {
	if (value === undefined || value === null) {
		if (isRequired) {
			return [null, new Error('is-required')]
		} else {
			return [null, null]
		}
	}

	switch (type) {
		case 'id':
			if (typeof value != 'string' || !mongo.ObjectID.isValid(value)) {
				return [null, new Error('incorrect-id')];
			}
			break;

		case 'string':
			if (typeof value != 'string') {
				return [null, new Error('must-be-a-string')];
			}
			break;

		case 'number':
			if (!Number.isFinite(value)) {
				return [null, new Error('must-be-a-number')];
			}
			break;

		case 'boolean':
			if (typeof value != 'boolean') {
				return [null, new Error('must-be-a-boolean')];
			}
			break;

		case 'array':
			if (!Array.isArray(value)) {
				return [null, new Error('must-be-an-array')];
			}
			break;

		case 'set':
			if (!Array.isArray(value)) {
				return [null, new Error('must-be-an-array')];
			} else if (hasDuplicates(value)) {
				return [null, new Error('duplicated-contents')];
			}
			break;

		case 'object':
			if (typeof value != 'object') {
				return [null, new Error('must-be-an-object')];
			}
			break;
	}

	if (type == 'id') value = new mongo.ObjectID(value);

	if (pipe) {
		const pipes = Array.isArray(pipe) ? pipe : [pipe];
		for (let i = 0; i < pipes.length; i++) {
			const result = pipes[i](value);
			if (result === false) {
				return [null, new Error('invalid-format')];
			} else if (result instanceof Error) {
				return [null, result];
			} else if (result !== true) {
				value = result;
			}
		}
	}

	return [value, null];
}

function it(value: any): MustBe;
function it(value: any, type: 'id', isRequired?: boolean, pipe?: Pipe<mongo.ObjectID> | Pipe<mongo.ObjectID>[]): [mongo.ObjectID, Error];
function it(value: any, type: 'string', isRequired?: boolean, pipe?: Pipe<string> | Pipe<string>[]): [string, Error];
function it(value: any, type: 'number', isRequired?: boolean, pipe?: Pipe<number> | Pipe<number>[]): [number, Error];
function it(value: any, type: 'boolean', isRequired?: boolean): [boolean, Error];
function it(value: any, type: 'array', isRequired?: boolean, pipe?: Pipe<any[]> | Pipe<any[]>[]): [any[], Error];
function it(value: any, type: 'set', isRequired?: boolean, pipe?: Pipe<any[]> | Pipe<any[]>[]): [any[], Error];
function it(value: any, type: 'object', isRequired?: boolean, pipe?: Pipe<any> | Pipe<any>[]): [any, Error];
function it(value: any, type?: any, isRequired?: boolean, pipe?: Pipe<any> | Pipe<any>[]): any {
	if (typeof type === 'undefined') {
		return mustBe(value);
	} else {
		return validate(value, type, isRequired, pipe);
	}
}

export default it;
