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
	const keys = Object.keys(drafts);
	const newDrafts: Record<string, NoteDraft> = {};

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		const [type, id] = key.split(':');
		if (type === 'note' && id !== userId) continue;
		const keyType = type === 'renote' ? 'quote' : type as keyof NoteKeys;
		const keyId = type === 'note' ? null : id;
		const uniqueId = Date.now().toString() + i.toString();
		const newKey = getKey(keyType, uniqueId, keyId as string);
		newDrafts[newKey] = {
			...drafts[key],
			uniqueId,
			type: keyType,
			auxId: keyId,
		};
		delete drafts[key];
	}

	if (Object.keys(newDrafts).length === 0) return;
	await idbSet(`drafts::${userId}`, newDrafts);
	miLocalStorage.setItem('drafts', JSON.stringify(drafts));
}

function getKey<T extends keyof NoteKeys>(type: T, uniqueId: string, ...args: Parameters<NoteKeys[T]>) {
	let key = `${type}:${uniqueId}`;
	for (const arg of args) {
		if (arg != null) key += `:${arg}`;
	}
	return key;
}

export async function getAll(userId: string) {
	const drafts = await idbGet(`drafts::${userId}`);
	return (drafts ?? {}) as Record<string, NoteDraft | undefined>;
}

export async function get<T extends keyof NoteKeys>(type: T, userId: string, uniqueId: string, ...args: Parameters<NoteKeys[T]>) {
	const key = getKey(type, uniqueId, ...args);
	const draft = await getAll(userId);
	return draft[key] ?? null;
}

export async function set<T extends keyof NoteKeys>(type: T, userId: string, uniqueId: string, draft: NoteDraft['data'], ...args: Parameters<NoteKeys[T]>) {
	const drafts = await getAll(userId);
	const key = getKey(type, uniqueId, ...args);
	drafts[key] = {
		updatedAt: new Date(),
		type,
		uniqueId,
		auxId: args[0] ?? null,
		data: JSON.parse(JSON.stringify(draft)) as NoteDraft['data'],
	};
	console.log(drafts);
	await idbSet(`drafts::${userId}`, drafts);
}

export async function remove<T extends keyof NoteKeys>(type: T, userId: string, uniqueId: string, ...args: Parameters<NoteKeys[T]>) {
	const drafts = await getAll(userId);
	const key = getKey(type, uniqueId, ...args);
	delete drafts[key];
	await idbSet(`drafts::${userId}`, drafts);
}
