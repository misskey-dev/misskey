import * as Misskey from 'misskey-js';
import type { PollEditorModelValue } from '@/components/MkPollEditor.vue';
import type { DeleteScheduleEditorModelValue } from '@/components/MkDeleteScheduleEditor.vue';
import { miLocalStorage } from '@/local-storage.js';
import { get as idbGet, set as idbSet } from '@/scripts/idb-proxy.js';

export type NoteDraft = {
	updatedAt: Date;
	type: keyof NoteKeys;
	uniqueId: string;
	auxId: string | null;
	data: {
		text: string;
		useCw: boolean;
		cw: string | null;
		visibility: (typeof Misskey.noteVisibilities)[number];
		localOnly: boolean;
		files: Misskey.entities.DriveFile[];
		poll: PollEditorModelValue | null;
		scheduledNoteDelete: DeleteScheduleEditorModelValue | null;
	};
};

type NoteKeys = {
	note: () => unknown,
	reply: (replyId: string) => unknown,
	quote: (renoteId: string) => unknown,
	channel: (channelId: string) => unknown,
}

export async function migrate(userId: string) {
	const raw = miLocalStorage.getItem('drafts');
	if (!raw) return;

	const drafts = JSON.parse(raw) as Record<string, NoteDraft>;
	const newDrafts: Record<string, NoteDraft> = {};

	for (let i = 0; i < Object.keys(drafts).length; i++) {
		const key = Object.keys(drafts)[i];
		const [type, id] = key.split(':');
		if (type === 'note' && id !== userId) continue;
		const keyType = type === 'renote' ? 'quote' : type as keyof NoteKeys;
		const keyId = type === 'note' ? null : id;
		const uniqueId = Date.now().toString() + i.toString();
		const newKey = getKey(keyType, uniqueId, false, keyId as string);
		newDrafts[newKey] = {
			...drafts[key],
			uniqueId,
			type: keyType,
			auxId: keyId,
		};
		delete drafts[key];
	}

	await idbSet(`drafts::${userId}`, JSON.stringify(newDrafts));
	miLocalStorage.setItem('drafts', JSON.stringify(drafts));
}

function getKey<T extends keyof NoteKeys, U extends boolean>(type: T, uniqueId: string | null, withUniqueId: U, ...args: Parameters<NoteKeys[T]>): U extends true ? { uniqueId: string, key: string } : string {
	const id = uniqueId ?? Date.now();
	let key = `${type}:${id}`;
	for (const arg of args) {
		if (arg != null) key += `:${arg}`;
	}

	if (withUniqueId) {
		return { uniqueId: id, key } as any;
	} else {
		return key as any;
	}
}

export async function getAll(userId: string) {
	const drafts = await idbGet(`drafts::${userId}`);
	if (!drafts) return {};
	return JSON.parse(drafts) as Record<string, NoteDraft | undefined>;
}

export async function get<T extends keyof NoteKeys>(type: T, userId: string, uniqueId: string | null, ...args: Parameters<NoteKeys[T]>) {
	const key = getKey(type, uniqueId, false, ...args);
	const draft = await getAll(userId)[key];
	return draft ?? null;
}

export async function set<T extends keyof NoteKeys>(type: T, userId: string, uniqueId: string | null, draft: NoteDraft['data'], ...args: Parameters<NoteKeys[T]>) {
	const drafts = await getAll(userId);
	const keys = getKey(type, uniqueId, true, ...args);
	drafts[keys.key] = {
		updatedAt: new Date(),
		type,
		uniqueId: uniqueId ?? keys.uniqueId,
		auxId: args[0] ?? null,
		data: draft,
	};
	await idbSet(`drafts::${userId}`, JSON.stringify(drafts));
}

export async function remove<T extends keyof NoteKeys>(type: T, userId: string, uniqueId: string | null, ...args: Parameters<NoteKeys[T]>) {
	const drafts = await getAll(userId);
	const key = getKey(type, uniqueId, false, ...args);
	delete drafts[key];
	await idbSet(`drafts::${userId}`, JSON.stringify(drafts));
}
