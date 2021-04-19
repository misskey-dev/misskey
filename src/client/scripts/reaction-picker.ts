import { Ref, ref } from 'vue';
import { popup } from '@client/os';

class ReactionPicker {
	private src: Ref<HTMLElement | null> = ref(null);
	private manualShowing = ref(false);
	private onChosen?: Function;
	private onClosed?: Function;

	constructor() {
		// nop
	}

	public async init() {
		await popup(import('@client/components/emoji-picker-dialog.vue'), {
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

	public show(src: HTMLElement, onChosen: Function, onClosed: Function) {
		this.src.value = src;
		this.manualShowing.value = true;
		this.onChosen = onChosen;
		this.onClosed = onClosed;
	}
}

export const reactionPicker = new ReactionPicker();
