type Await<T> = T extends Promise<infer U> ? U : T;

type AwaitAll<T> = {
	[P in keyof T]: Await<T[P]>;
};

export async function awaitAll<T>(obj: T): Promise<AwaitAll<T>> {
	const target = {} as any;
	const keys = Object.keys(obj);
	const rawValues = Object.values(obj);
	const retValues = ((values: any[]): any[] =>
		values.map(value => {
			if (!value || !value.constructor || value.constructor.name !== 'Object') return value;
			return awaitAll(value);
		})
	)(rawValues);
	const values = await Promise.all(retValues);
	for (let i = 0; i < values.length; i++) {
		target[keys[i]] = values[i];
	}
	return target;
}
