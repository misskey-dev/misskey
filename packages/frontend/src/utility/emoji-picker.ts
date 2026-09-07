/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, ref, shallowRef, watch } from 'vue';
import type { ShallowRef } from 'vue';
import type MkEmojiPickerWindow_TypeOnly from '@/components/MkEmojiPickerWindow.vue';
import MkEmojiPickerDialog from '@/components/MkEmojiPickerDialog.vue';
import { popup } from '@/os.js';
import { prefer } from '@/preferences.js';

/**
 * 絵文字ピッカーを表示する。
 * 類似の機能として{@link ReactionPicker}が存在しているが、この機能とは動きが異なる。
 * 投稿フォームなどで絵文字を選択する時など、絵文字ピックアップ後でもダイアログが消えずに残り、
 * 一度表示したダイアログを連続で使用できることが望ましいシーンでの利用が想定される。
 */
class EmojiPicker {
	private isWindow: boolean = false;
	private windowComponentEl: ShallowRef<InstanceType<typeof MkEmojiPickerWindow_TypeOnly> | null> = shallowRef(null);
	private windowShowing: boolean = false;

	private emojisRef = ref<string[]>([]);

	constructor() {
		// nop
	}

	public init() {
		watch([prefer.r.emojiPaletteForMain, prefer.r.emojiPalettes], () => {
			this.emojisRef.value = prefer.s.emojiPaletteForMain == null ? prefer.s.emojiPalettes[0].emojis : prefer.s.emojiPalettes.find(palette => palette.id === prefer.s.emojiPaletteForMain)?.emojis ?? [];
		}, {
			immediate: true,
		});

		if (prefer.s.emojiPickerStyle === 'window') {
			// init後にemojiPickerStyleが変わった場合、drawer/popup用の初期化をスキップするため、
			// 正常に絵文字ピッカーが表示されない。
			// なので一度initされたらwindow表示で固定する（設定を変更したら要リロード）
			this.isWindow = true;
		}
	}

	public show(opts: {
		anchorElement: HTMLElement,
		onChosen?: (emoji: string) => void,
		onClosed?: () => void,
	}) {
		const anchorRef = shallowRef(opts.anchorElement);

		if (this.isWindow) {
			if (this.windowShowing) return;
			this.windowShowing = true;
			const { dispose, componentRef } = popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerWindow.vue')), {
				pinnedEmojis: this.emojisRef,
				asReactionPicker: false,
			}, {
				chosen: (emoji) => {
					if (opts.onChosen) opts.onChosen(emoji);
				},
				closed: () => {
					if (opts.onClosed) opts.onClosed();
					this.windowShowing = false;
					dispose();
				},
			});
			this.windowComponentEl = componentRef;
		} else {
			// defineAsyncComponentはiOS等でユーザーアクティベーションが失われてfocusが効かなくなるため使用不可
			const { dispose } = popup(MkEmojiPickerDialog, {
				anchorElement: anchorRef,
				pinnedEmojis: this.emojisRef,
				asReactionPicker: false,
				choseAndClose: false,
			}, {
				done: (emoji: string) => {
					if (opts.onChosen) opts.onChosen(emoji);
				},
				closed: () => {
					if (opts.onClosed) opts.onClosed();
					dispose();
				},
			});
		}
	}

	public closeWindow() {
		if (this.windowComponentEl.value != null) {
			this.windowComponentEl.value.close();
		}
	}
}

export const emojiPicker = new EmojiPicker();
