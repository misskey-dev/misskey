import { loadConfig } from './config.js';
import { envOption } from './env.js';

const config = loadConfig();

/**
 * This function removes the domain part from a URL if it matches the configured domain.
 * @param url The URL to process.
 */
export function removeDomain(url: null): null;
export function removeDomain(url: string): string;
export function removeDomain(url: string | null): string | null;
export function removeDomain(url: string | null): string | null {
	if (!envOption.domainRewrite) {
		return url;
	}

	if (url && url.startsWith(config.url)) {
		return url.slice(config.url.length) || '/';
	} 
	return url;
}

export type PartialMinote = {
	id: string;
	user: {
		avatarUrl: string | null;
	} | null;
	files?: {
		url: string | null;
		thumbnailUrl: string | null;
	}[]
};

// If the domain is not /, rewrite to /
export async function rewriteMiNote(note: PartialMinote): Promise<PartialMinote> {
	if (note.user) {
		note.user = await rewriteUser(note.user);
	}

	if (note.files && note.files.length > 0) {
		for (const file of note.files) {
			if (file.url) {
				file.url = removeDomain(file.url);
			}
			if (file.thumbnailUrl) {
				file.thumbnailUrl = removeDomain(file.thumbnailUrl);
			}
		}
	}

	return note as unknown as PartialMinote;
}

export async function rewriteUser(user: { avatarUrl: string | null } | null): Promise<{ avatarUrl: string | null } | null> {
	if (user && user.avatarUrl) {
		user.avatarUrl = removeDomain(user.avatarUrl);
	}
	return user;
}

export async function rewriteMiNotes(notes: PartialMinote[]): Promise<PartialMinote[]> {
	return Promise.all(notes.map(n => rewriteMiNote(n)));
}
