/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, Ref, ref, computed, ComputedRef } from 'vue';
import { popup } from '@/os.js';
import { defaultStore } from '@/store.js';

/**
 * 絵文字ピッカーを表示する。
 * 類似の機能として{@link ReactionPicker}が存在しているが、この機能とは動きが異なる。
 * 投稿フォームなどで絵文字を選択する時など、絵文字ピックアップ後でもダイアログが消えずに残り、
 * 一度表示したダイアログを連続で使用できることが望ましいシーンでの利用が想定される。
 */
class EmojiPicker {
	private src: Ref<HTMLElement | null> = ref(null);
	private manualShowing = ref(false);
	private itemPresetType = ref<DeckItemPresetType>('auto');
	private onChosen?: (emoji: string) => void;
	private onClosed?: () => void;

	constructor() {
		// nop
	}

	/**
	 * リアクションデッキ・絵文字デッキを動的に切り替えるための{@link ComputedRef}を作成する。
	 */
	private createDeckItemCompute(): ComputedRef<string[]> {
		const itemPresetTypeRef = this.itemPresetType;
		const useReactionDeckItemsRef = defaultStore.reactiveState.useReactionDeckItems;
		const reactionsRef = defaultStore.reactiveState.reactions;
		const emojisRef = defaultStore.reactiveState.emojiDeckItems;

		return computed(() => {
			switch (itemPresetTypeRef.value) {
				case 'reactions':
					return reactionsRef.value;
				case 'emojis':
					return emojisRef.value;
				default:
					return useReactionDeckItemsRef.value ? reactionsRef.value : emojisRef.value;
			}
		});
	}

	public async init() {
		const emojisComputed = this.createDeckItemCompute();
		await popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerDialog.vue')), {
			src: this.src,
			pinnedEmojis: emojisComputed,
			asReactionPicker: true,
			manualShowing: this.manualShowing,
			choseAndClose: false,
		}, {
			done: emoji => {
				if (this.onChosen) this.onChosen(emoji);
			},
			close: () => {
				this.manualShowing.value = false;
			},
			closed: () => {
				this.src.value = null;
				if (this.onClosed) this.onClosed();
			},
		});
	}

	public show(
		src: HTMLElement,
		onChosen?: EmojiPicker['onChosen'],
		onClosed?: EmojiPicker['onClosed'],
		itemPresetType: DeckItemPresetType = 'auto',
	) {
		this.src.value = src;
		this.itemPresetType.value = itemPresetType;
		this.manualShowing.value = true;
		this.onChosen = onChosen;
		this.onClosed = onClosed;
	}
}

export type DeckItemPresetType = 'reactions' | 'emojis' | 'auto';

export const emojiPicker = new EmojiPicker();
