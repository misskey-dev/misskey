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
		await popup(defineAsyncComponent(() => import('@/components/emoji-picker-dialog.vue')), {
			src: this.src,
			asReactionPicker: true,
			manualShowing: this.manualShowing
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
