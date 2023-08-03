/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, Ref, ref } from 'vue';
import { popup } from '@/os';

class ReactionPicker {
	private src: Ref<HTMLElement | null> = ref(null);
	private manualShowing = ref(false);
	private onChosen?: (reaction: string) => void;
	private onClosed?: () => void;

	constructor() {
		// nop
	}

	public async init() {
		await popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerDialog.vue')), {
			src: this.src,
			asReactionPicker: true,
			manualShowing: this.manualShowing,
		}, {
			done: reaction => {
				this.onChosen!(reaction);
				this.manualShowing.value = false;
			},
			close: () => {
				this.manualShowing.value = false;
			},
			hide: () => {
				this.src.value = null;
				this.onClosed!();
			},
			click: () => {
				this.manualShowing.value = false;
			}
		});
	}

	public show(src: HTMLElement, onChosen: ReactionPicker['onChosen'], onClosed: ReactionPicker['onClosed']) {
		this.src.value = src;
		this.manualShowing.value = true;
		this.onChosen = onChosen;
		this.onClosed = onClosed;
	}
}

export const reactionPicker = new ReactionPicker();
