export type Promiseable<T extends any> = { [K in keyof T]: Promise<T[K]> | T[K] };

export async function awaitAll<T extends Record<string, any>, U extends Promiseable<T>>(obj: U): Promise<T> {
	const target = {} as any;
	const keys = Object.keys(obj);
	const values = Object.values(obj);

	const resolvedValues = await Promise.all(values.map(value =>
		(!value || !value.constructor || value.constructor.name !== 'Object')
			? value
			: awaitAll(value)
	));

	for (let i = 0; i < keys.length; i++) {
		target[keys[i]] = resolvedValues[i];
	}

	return target;
}
