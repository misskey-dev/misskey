/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { shallowRef, ref, watch } from 'vue';
import MkEmojiPickerDialog from '@/components/MkEmojiPickerDialog.vue';
import { popup } from '@/os.js';
import { prefer } from '@/preferences.js';

class ReactionPicker {
	private reactionsRef = ref<string[]>([]);

	constructor() {
		// nop
	}

	public init() {
		watch([prefer.r.emojiPaletteForReaction, prefer.r.emojiPalettes], () => {
			this.reactionsRef.value = prefer.s.emojiPaletteForReaction == null ? prefer.s.emojiPalettes[0].emojis : prefer.s.emojiPalettes.find(palette => palette.id === prefer.s.emojiPaletteForReaction)?.emojis ?? [];
		}, {
			immediate: true,
		});
	}

	public show(
		anchorElement: HTMLElement | null,
		targetNote: Misskey.entities.Note | null,
		onChosen?: (reaction: string) => void,
		onClosed?: () => void,
	) {
		const anchorRef = shallowRef(anchorElement);
		const targetNoteRef = ref(targetNote);

		// defineAsyncComponentはiOS等でユーザーアクティベーションが失われてfocusが効かなくなるため使用不可
		const { dispose } = popup(MkEmojiPickerDialog, {
			anchorElement: anchorRef,
			pinnedEmojis: this.reactionsRef,
			asReactionPicker: true,
			targetNote: targetNoteRef,
		}, {
			done: (reaction: string) => {
				if (onChosen) onChosen(reaction);
			},
			closed: () => {
				if (onClosed) onClosed();
				dispose();
			},
		});
	}
}

export const reactionPicker = new ReactionPicker();
