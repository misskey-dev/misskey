/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { markRaw, ref, watch } from 'vue';
import type { Component } from 'vue';
import { popup, popupAsyncWithDialog } from '@/os.js';
import { prefer } from '@/preferences.js';

class ReactionPicker {
	private loadedComponent: Component | null = null;
	private reactionsRef = ref<string[]>([]);

	constructor() {
		// nop
	}

	public init() {
		// チャンクをプリロードしてキャッシュしておく。
		// iOS PWA では await を挟むとユーザーアクティベーションが失われfocusが効かなくなるため、
		// show() 呼び出し時には同期的に popup() できるよう事前にコンポーネントを解決しておく。
		import('@/components/MkEmojiPickerDialog.vue').then(m => {
			this.loadedComponent = markRaw(m.default);
		}).catch(err => {
			console.error('[ReactionPicker] Failed to preload MkEmojiPickerDialog:', err);
		});

		watch([prefer.r.emojiPaletteForReaction, prefer.r.emojiPalettes], () => {
			this.reactionsRef.value = prefer.s.emojiPaletteForReaction == null ? prefer.s.emojiPalettes[0].emojis : prefer.s.emojiPalettes.find(palette => palette.id === prefer.s.emojiPaletteForReaction)?.emojis ?? [];
		}, {
			immediate: true,
		});
	}

	public show(anchorElement: HTMLElement | null, targetNote: Misskey.entities.Note | null, onChosen?: (reaction: string) => void, onClosed?: () => void) {
		const anchorRef = ref(anchorElement);
		const targetNoteRef = ref(targetNote);

		if (this.loadedComponent) {
			// 通常パス: コンポーネント解決済みのため同期的に popup() できる。
			// ユーザーアクティベーションコンテキストが維持されiOSでもfocusが機能する。
			const { dispose } = popup(this.loadedComponent, {
				anchorElement: anchorRef,
				pinnedEmojis: this.reactionsRef,
				asReactionPicker: true,
				targetNote: targetNoteRef,
			}, {
				done: (reaction: string) => {
					if (onChosen) onChosen(reaction);
				},
				close: () => { /* MkModal が自身でclose処理を行う */ },
				closed: () => {
					if (onClosed) onClosed();
					dispose();
				},
			});
		} else {
			// フォールバック: 初回タップがプリロード完了前の稀なケース
			popupAsyncWithDialog(
				import('@/components/MkEmojiPickerDialog.vue').then(m => {
					this.loadedComponent = markRaw(m.default);
					return this.loadedComponent as Component;
				}),
				{
					anchorElement: anchorRef,
					pinnedEmojis: this.reactionsRef,
					asReactionPicker: true,
					targetNote: targetNoteRef,
				},
				{
					done: (reaction: string) => {
						if (onChosen) onChosen(reaction);
					},
					close: () => { /* MkModal が自身でclose処理を行う */ },
					closed: () => {
						if (onClosed) onClosed();
					},
				},
			);
		}
	}
}

export const reactionPicker = new ReactionPicker();
