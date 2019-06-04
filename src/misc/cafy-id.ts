import { Context } from 'cafy';

export class ID<Maybe = string> extends Context<string | (Maybe extends {} ? string : Maybe)> {
	public readonly name = 'ID';

	constructor(optional = false, nullable = false) {
		super(optional, nullable);

		this.push(v => {
			if (typeof v !== 'string') {
				return new Error('must-be-an-id');
			}
			return true;
		});
	}

	public getType() {
		return super.getType('String');
	}

	public makeOptional(): ID<undefined> {
		return new ID(true, false);
	}

	public makeNullable(): ID<null> {
		return new ID(false, true);
	}

	public makeOptionalNullable(): ID<undefined | null> {
		return new ID(true, true);
	}
}
