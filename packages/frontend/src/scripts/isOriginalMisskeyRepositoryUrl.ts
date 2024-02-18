
const originalMisskeyRepositoryUrls: string[] = [
	'https://github.com/misskey-dev/misskey',
	'https://github.com/syuilo/misskey',
];

export function isOriginalMisskeyRepositoryUrl(url: string | null): boolean {
	return url != null && originalMisskeyRepositoryUrls.includes(url);
}
