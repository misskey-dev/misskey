export type RequestLogItem = {
	failed: boolean;
	url: string;
	name: string;
	error?: string;
};

export function emptyStrToUndefined(value: string | null) {
	return value ? value : undefined;
}

export function emptyStrToNull(value: string) {
	return value === '' ? null : value;
}

export function emptyStrToEmptyArray(value: string) {
	return value === '' ? [] : value.split(',').map(it => it.trim());
}

