export default function(user: { name?: string | null, username: string }): string {
	// Show username if name is empty.
	// XXX: typescript-eslint has no configuration to allow using `||` against string.
	// https://github.com/typescript-eslint/typescript-eslint/issues/4906
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	return user.name || user.username;
}
