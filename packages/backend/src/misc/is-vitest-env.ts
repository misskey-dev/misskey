export function isVitestEnv(): boolean {
	return process.env.NODE_ENV === 'test' && process.env.VITEST === 'true';
}
