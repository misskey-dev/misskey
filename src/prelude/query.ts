export function query(source: any, checkCleanablity: boolean = false): any {
	return typeof source === 'object' ? Array.isArray(source) ? array(source) : object(source, checkCleanablity) : source;
}

function object(source: any, checkCleanablity: boolean): any {
	return (
		source === null ? null :
		!checkCleanablity || source.__cleanable ? Object.entries(source).reduce((a, [k, v]) => {
			if (v !== undefined && (!checkCleanablity || k !== '__cleanable'))
				a[k] = query(v, true);
			return a;
		}, {} as { [x: string]: any }) : source);
}

function array(source: any[]): any[] {
	return source === null ? null : source.filter(x => x !== undefined).map(x => query(x, true));
}
