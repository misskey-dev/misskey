/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, Ref, ref } from 'vue';
import { popup } from '@/os.js';

class ReactionPicker {
	private src: Ref<HTMLElement | null> = ref(null);
	private manualShowing = ref(false);
	private choseAndClose = ref(true);
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
			choseAndClose: this.choseAndClose,
		}, {
			done: reaction => {
				this.onChosen!(reaction);
			},
			close: () => {
				this.manualShowing.value = false;
			},
			closed: () => {
				this.src.value = null;
				this.onClosed!();
			},
		});
	}

	public show(
		src: HTMLElement,
		onChosen: ReactionPicker['onChosen'],
		onClosed: ReactionPicker['onClosed'],
		choseAndClose = true,
	) {
		this.src.value = src;
		this.manualShowing.value = true;
		this.choseAndClose.value = choseAndClose;
		this.onChosen = onChosen;
		this.onClosed = onClosed;
	}
}

export const reactionPicker = new ReactionPicker();
