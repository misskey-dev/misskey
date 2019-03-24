export const Q = {
	And: <T>(table: string, select: '*' | keyof T | (keyof T)[], fn: (q: QueryBuilder<T>) => string[]): string => {
		const sqls = fn(ops);
		const _select = select === '*' ? '*' : Array.isArray(select) ? select.map(c => `"${c}"`).join(', ') : `"${select}"`;
		const where = '(' + sqls.join(' AND ') + ')';
		return `SELECT ${_select} FROM ${table} WHERE ${where}`;
	},

	Or: <T>(table: string, select: '*' | keyof T | (keyof T)[], fn: (q: QueryBuilder<T>) => string[]): string => {
		const sqls = fn(ops);
		const _select = select === '*' ? '*' : Array.isArray(select) ? select.map(c => `"${c}"`).join(', ') : `"${select}"`;
		const where = '(' + sqls.join(' OR ') + ')';
		return `SELECT ${_select} FROM ${table} WHERE ${where}`;
	}
};

function sanitize(str: string): string {
	return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, char => {
		switch (char) {
			case '\0':
				return '\\0';
			case '\x08':
				return '\\b';
			case '\x09':
				return '\\t';
			case '\x1a':
				return '\\z';
			case '\n':
				return '\\n';
			case '\r':
				return '\\r';
			case '\"':
			case '\'':
			case '\\':
			case '%':
				// prepends a backslash to backslash, percent, and double/single quotes
				return '\\' + char;
			default: return char;
		}
	});
}

function val(value: any): string {
	if (typeof value === 'string') return `'${sanitize(value)}'`;
	if (typeof value === 'number') return value.toString();
}

type QueryBuilder<T> = {
	Equal: <P extends keyof T>(column: P, value: T[P]) => string;
	NotEqual: <P extends keyof T>(column: P, value: T[P]) => string;
	In: <P extends keyof T>(column: P, value: T[P][]) => string;
	NotIn: <P extends keyof T>(column: P, value: T[P][]) => string;
	InSub: <P extends keyof T>(column: P, query: string) => string;
	And: (qs: string[]) => string;
	Or: (qs: string[]) => string;
};

const ops = {} as any;

const And = <T>(qs: string[]): string => {
	return '(' + qs.join(' AND ') + ')';
};
ops.And = And;

const Or = <T>(qs: string[]): string => {
	return '(' + qs.join(' OR ') + ')';
};
ops.Or = Or;

const Equal = (column: string, value: any): string => {
	return `"${column}" = ${val(value)}`;
};
ops.Equal = Equal;

const NotEqual = (column: string, value: any): string => {
	return `"${column}" != ${val(value)}`;
};
ops.NotEqual = NotEqual;

const In = (column: string, values: any[]): string => {
	return `"${column}" IN (${values.map(v => val(v)).join(', ')})`;
};
ops.In = In;

const NotIn = (column: string, values: any[]): string => {
	return `"${column}" NOT IN (${values.map(v => val(v)).join(', ')})`;
};
ops.NotIn = NotIn;

const InSub = (column: string, query: string): string => {
	return `"${column}" IN (${query})`;
};
ops.InSub = InSub;
/*
type User = {
	id: number;
	age: number;
	name: string;
};

type Following = {
	followeeId: number;
	followerId: number;
};
*/
/*
const sql = Q.And<User>(q => [
	q.Equal('name', 'alic"e'),
	q.NotEqual('age', 42),
	q.Or([
		q.Equal('id', 1),
		q.Equal('id', 2),
		q.In('id', [7, 8, 9])
	])
]);*/
/*
const sql = Q.And<User>('users', '*', q => [
	q.InSub('id', Q.And<Following>('followings', 'followeeId', q => [
		q.Equal('followerId', 2)
	]))
]);

console.log(sql);
*/
