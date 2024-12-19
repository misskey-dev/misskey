/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { defineAsyncComponent, Ref, ref } from 'vue';
import { popup } from '@/os.js';
import { defaultStore } from '@/store.js';

class ReactionPicker {
	private src: Ref<HTMLElement | null> = ref(null);
	private manualShowing = ref(false);
	private targetNote: Ref<Misskey.entities.Note | null> = ref(null);
	private onChosen?: (reaction: string) => void;
	private onClosed?: () => void;
	public isInitialized = false;

	constructor() {
		// nop
	}

	public async init() {
		if (this.isInitialized) return;

		const reactionsRef = defaultStore.reactiveState.reactions;
		await popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerDialog.vue')), {
			src: this.src,
			pinnedEmojis: reactionsRef,
			asReactionPicker: true,
			targetNote: this.targetNote,
			manualShowing: this.manualShowing,
		}, {
			done: reaction => {
				if (this.onChosen) this.onChosen(reaction);
			},
			close: () => {
				this.manualShowing.value = false;
			},
			closed: () => {
				this.src.value = null;
				if (this.onClosed) this.onClosed();
			},
		});
		this.isInitialized = true;
	}

	public show(src: HTMLElement | null, targetNote: Misskey.entities.Note | null, onChosen?: ReactionPicker['onChosen'], onClosed?: ReactionPicker['onClosed']) {
		this.src.value = src;
		this.targetNote.value = targetNote;
		this.manualShowing.value = true;
		this.onChosen = onChosen;
		this.onClosed = onClosed;
	}
}

export const reactionPicker = new ReactionPicker();
