import { Context } from 'cafy';

export class ID<Maybe = string> extends Context<number | (Maybe extends {} ? number : Maybe)> {
	public readonly name = 'ID';

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
		return super.getType('Number');
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
