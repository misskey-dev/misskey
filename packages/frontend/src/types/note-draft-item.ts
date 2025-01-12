import * as Misskey from 'misskey-js';
import type { PollEditorModelValue } from '@/components/MkPollEditor.vue';

export type NoteDraftItem = {
	updatedAt: string;
	channel?: {
		id: string;
		name: string;
	};
	renote?: {
		id: string;
		text: string | null;
		user: {
			id: string;
			username: string;
			host: string | null;
		};
	};
	reply?: {
		id: string;
		text: string | null;
		user: {
			id: string;
			username: string;
			host: string | null;
		};
	};
	data: {
		text: string;
		useCw: boolean;
		cw: string | null;
		visibility: 'public' | 'followers' | 'home' | 'specified';
		localOnly: boolean;
		files: Misskey.entities.DriveFile[];
		poll: PollEditorModelValue | null;
		visibleUserIds?: string[];
	};
};
