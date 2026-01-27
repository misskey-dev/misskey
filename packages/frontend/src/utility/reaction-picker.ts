/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { defineAsyncComponent, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { popup } from '@/os.js';
import { prefer } from '@/preferences.js';

class ReactionPicker {
	private anchorElement: Ref<HTMLElement | null> = ref(null);
	private manualShowing = ref(false);
	private targetNote: Ref<Misskey.entities.Note | null> = ref(null);
	private onChosen?: (reaction: string) => void;
	private onClosed?: () => void;

	constructor() {
		// nop
	}

	public async init() {
		const reactionsRef = ref<string[]>([]);

		watch([prefer.r.emojiPaletteForReaction, prefer.r.emojiPalettes], () => {
			reactionsRef.value = prefer.s.emojiPaletteForReaction == null ? prefer.s.emojiPalettes[0].emojis : prefer.s.emojiPalettes.find(palette => palette.id === prefer.s.emojiPaletteForReaction)?.emojis ?? [];
		}, {
			immediate: true,
		});

		await popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerDialog.vue')), {
			anchorElement: this.anchorElement,
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
				this.anchorElement.value = null;
				if (this.onClosed) this.onClosed();
			},
		});
	}

	public show(anchorElement: HTMLElement | null, targetNote: Misskey.entities.Note | null, onChosen?: ReactionPicker['onChosen'], onClosed?: ReactionPicker['onClosed']) {
		this.anchorElement.value = anchorElement;
		this.targetNote.value = targetNote;
		this.manualShowing.value = true;
		this.onChosen = onChosen;
		this.onClosed = onClosed;
	}
}

export const reactionPicker = new ReactionPicker();
