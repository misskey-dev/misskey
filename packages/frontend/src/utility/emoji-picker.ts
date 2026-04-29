/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw, shallowRef, ref, watch } from 'vue';
import type MkEmojiPickerDialog__TypeReferenceOnly from '@/components/MkEmojiPickerDialog.vue';
import { popup, popupAsyncWithDialog } from '@/os.js';
import { prefer } from '@/preferences.js';

/**
 * 絵文字ピッカーを表示する。
 * 類似の機能として{@link ReactionPicker}が存在しているが、この機能とは動きが異なる。
 * 投稿フォームなどで絵文字を選択する時など、絵文字ピックアップ後でもダイアログが消えずに残り、
 * 一度表示したダイアログを連続で使用できることが望ましいシーンでの利用が想定される。
 */
class EmojiPicker {
	private loadedComponent: typeof MkEmojiPickerDialog__TypeReferenceOnly | null = null;
	private emojisRef = ref<string[]>([]);

	constructor() {
		// nop
	}

	public init() {
		// コンポーネントをプリロードしてキャッシュしておく。
		// iOS PWA では await を挟むとユーザーアクティベーションが失われfocusが効かなくなるため、
		// show() 呼び出し時には同期的に popup() できるよう事前にコンポーネントを解決しておく。
		import('@/components/MkEmojiPickerDialog.vue').then(m => {
			this.loadedComponent = markRaw(m.default);
		}).catch(err => {
			console.error('[EmojiPicker] Failed to preload MkEmojiPickerDialog:', err);
		});

		watch([prefer.r.emojiPaletteForMain, prefer.r.emojiPalettes], () => {
			this.emojisRef.value = prefer.s.emojiPaletteForMain == null ? prefer.s.emojiPalettes[0].emojis : prefer.s.emojiPalettes.find(palette => palette.id === prefer.s.emojiPaletteForMain)?.emojis ?? [];
		}, {
			immediate: true,
		});
	}

	public show(
		anchorElement: HTMLElement,
		onChosen?: (emoji: string) => void,
		onClosed?: () => void,
	) {
		const anchorRef = shallowRef(anchorElement);

		if (this.loadedComponent) {
			// コンポーネント解決済みのため同期的に popup() できる。
			// ユーザーアクティベーションコンテキストが維持されiOSでもfocusが機能する。
			const { dispose } = popup(this.loadedComponent, {
				anchorElement: anchorRef,
				pinnedEmojis: this.emojisRef,
				asReactionPicker: false,
				choseAndClose: false,
			}, {
				done: (emoji: string) => {
					if (onChosen) onChosen(emoji);
				},
				closed: () => {
					if (onClosed) onClosed();
					dispose();
				},
			});
		} else {
			// フォールバック: 初回タップがプリロード完了前
			popupAsyncWithDialog(
				import('@/components/MkEmojiPickerDialog.vue').then(m => {
					this.loadedComponent = markRaw(m.default);
					return this.loadedComponent;
				}),
				{
					anchorElement: anchorRef,
					pinnedEmojis: this.emojisRef,
					asReactionPicker: false,
					choseAndClose: false,
				},
				{
					done: (emoji: string) => {
						if (onChosen) onChosen(emoji);
					},
					closed: () => {
						if (onClosed) onClosed();
					},
				},
			);
		}
	}
}

export const emojiPicker = new EmojiPicker();
