export function query(source: any): any {
	return typeof source === 'object' ? Array.isArray(source) ? array(source) : object(source) : source;
}

function object(source: any): any {
	return source === null ? null : Object.entries(source).reduce((a, [k, v]) => {
			if (v !== undefined)
				a[k] = query(v);
			return a;
		}, {} as { [x: string]: any });
}

function array(source: any[]): any[] {
	return source === null ? null : source.filter(x => x !== undefined).map(query);
}
