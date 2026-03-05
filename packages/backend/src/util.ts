/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
	}[];
	renote?: PartialMinote | null;
	reply?: PartialMinote | null;
};

// If the domain is not /, rewrite to /
export async function rewriteMiNote(
	note: PartialMinote,
): Promise<PartialMinote> {
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
	if (note.renote) note.renote = await rewriteMiNote(note.renote);
	if (note.reply) note.reply = await rewriteMiNote(note.reply);

	return note as unknown as PartialMinote;
}

export async function rewriteUser(
	user: { avatarUrl: string | null } | null,
): Promise<{ avatarUrl: string | null } | null> {
	if (user && user.avatarUrl) {
		user.avatarUrl = removeDomain(user.avatarUrl);
	}
	return user;
}

export async function rewriteMiNotes(
	notes: PartialMinote[],
): Promise<PartialMinote[]> {
	return Promise.all(notes.map((n) => rewriteMiNote(n)));
}

// Preprocess a WebSocket message, rewriting URLs as necessary
export async function PreprocessWebsocketMessage(data: any): Promise<any> {
	// Skip if domain rewrite is disabled
	if (envOption.domainRewrite === false) return data;

	if (data.channel === 'notesStream') {
		if (data.message) {
			data.message = await rewriteMiNote(data.message);
		}
	}

	if (data.channel.startsWith('mainStream:')) {
		if (data.message) {
			data.message = await processMainStreamMessage(data.message);
		}
	}

	if (data.channel.startsWith('chatUserStream:')) {
		if (data.message) {
			data.message = await processChatMessage(data.message);
		}
	}

	return data;
}

async function processMainStreamMessage(message: any): Promise<any> {
	if (message.avatarUrl) message.avatarUrl = removeDomain(message.avatarUrl);

	if (message.body) {
		if (message.body.note) message.body.note = await rewriteMiNote(message.body.note);
		if (message.body.renote) message.body.renote = await rewriteMiNote(message.body.renote);
		if (message.body.reply) message.body.reply = await rewriteMiNote(message.body.reply);
		if (message.body.user) message.body.user = await rewriteUser(message.body.user);
	}

	return message;
}

async function processChatMessage(message: any): Promise<any> {
	if (message.body) {
		if (message.body.file) message.body.file = await processFileObject(message.body.file);
		if (message.body.fromUser) message.body.fromUser = await rewriteUser(message.body.fromUser);
		if (message.body.toUser) message.body.toUser = await rewriteUser(message.body.toUser);
	}

	return message;
}

async function processFileObject(file: any): Promise<any> {
	if (file.url) {
		file.url = removeDomain(file.url);
	}
	if (file.thumbnailUrl) {
		file.thumbnailUrl = removeDomain(file.thumbnailUrl);
	}
	return file;
}
