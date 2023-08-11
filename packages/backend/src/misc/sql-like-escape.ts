export function sqlLikeEscape(s: string) {
	return s.replace(/([%_])/g, '\\$1');
}
