export function safeForSql(text: string): boolean {
	return !/[\0\x08\x09\x1a\n\r"'\\\%]/g.test(text);
}
