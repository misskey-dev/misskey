const specialCharactersRegexp = /(\(.*?\)|(\+.*(?=@)))/gu;

export function normalizeEmailAddress(email: string | null): string | null {
	return email?.replaceAll(specialCharactersRegexp, '') ?? null;
}
