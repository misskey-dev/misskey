import { Context } from 'cafy';

export class StringID<Maybe = string> extends Context<string | Maybe> {
	public readonly name = 'StringID';

	constructor(optional = false, nullable = false) {
		super(optional, nullable);

		this.push((v: any) => {
			if (typeof v !== 'string') {
				return new Error('must-be-an-id');
			}
			return true;
		});
	}

	public getType() {
		return super.getType('String');
	}

	public makeOptional(): StringID<undefined> {
		return new StringID(true, false);
	}

	public makeNullable(): StringID<null> {
		return new StringID(false, true);
	}

	public makeOptionalNullable(): StringID<undefined | null> {
		return new StringID(true, true);
	}
}

export class NumericalID<Maybe = number> extends Context<number | Maybe> {
	public readonly name = 'NumericalID';

	constructor(optional = false, nullable = false) {
		super(optional, nullable);

		this.push((v: any) => {
			if (typeof v !== 'number') {
				return new Error('must-be-an-id');
			}
			return true;
		});
	}

	public getType() {
		return super.getType('String');
	}

	public makeOptional(): NumericalID<undefined> {
		return new NumericalID(true, false);
	}

	public makeNullable(): NumericalID<null> {
		return new NumericalID(false, true);
	}

	public makeOptionalNullable(): NumericalID<undefined | null> {
		return new NumericalID(true, true);
	}
}
