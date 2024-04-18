import * as Misskey from 'misskey-js';
import type { PollEditorModelValue } from '@/components/MkPollEditor.vue';
import type { DeleteScheduleEditorModelValue } from '@/components/MkDeleteScheduleEditor.vue';
import { miLocalStorage } from '@/local-storage.js';

export type NoteDraft = {
	updatedAt: Date;
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

export function getAll() {
	const drafts = miLocalStorage.getItem('drafts');
	if (!drafts) return {};
	return JSON.parse(drafts) as Record<string, NoteDraft | undefined>;
}

export function get(key: string) {
	const draft = getAll()[key];
	return draft ?? null;
}

export function set(key: string, draft: NoteDraft['data']) {
	const drafts = getAll();
	drafts[key] = {
		updatedAt: new Date(),
		data: draft,
	};
	miLocalStorage.setItem('drafts', JSON.stringify(drafts));
}

export function remove(key: string) {
	const drafts = getAll();
	delete drafts[key];
	miLocalStorage.setItem('drafts', JSON.stringify(drafts));
}
