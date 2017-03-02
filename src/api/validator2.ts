import * as mongo from 'mongodb';
import hasDuplicates from '../common/has-duplicates';

type CustomValidator<T> = (value: T) => boolean | string;

interface Validator {
	get: () => [any, string];

	required: () => Validator;

	validate: (validator: CustomValidator<any>) => Validator;
}

class ValidatorCore implements Validator {
	value: any;
	error: string;

	constructor() {
		this.value = null;
		this.error = null;
	}

	required() {
		if (this.error === null && this.value === null) {
			this.error = 'required';
		}
		return this;
	}

	get(): [any, string] {
		return [this.value, this.error];
	}

	validate(validator: CustomValidator<any>) {
		if (this.error || this.value === null) return this;
		const result = validator(this.value);
		if (result === false) {
			this.error = 'invalid-format';
		} else if (typeof result == 'string') {
			this.error = result;
		}
		return this;
	}
}

class NumberValidator extends ValidatorCore {
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

	get(): [number, string] {
		return super.get();
	}

	validate(validator: CustomValidator<number>) {
		return super.validate(validator);
	}
}

const it = (value: any) => ({
	must: {
		be: {
			a: {
				string: 0,
				number: () => new NumberValidator(value),
				boolean: 0,
				set: 0
			},
			an: {
				id: 0,
				array: 0,
				object: 0
			}
		}
	}
});

export default it;

const [n, e] = it(42).must.be.a.number().required().range(10, 70).validate(x => x != 21).get();
