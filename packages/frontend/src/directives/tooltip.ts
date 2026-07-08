/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: useTooltip関数使うようにしたい
// ただディレクティブ内でonUnmountedなどのcomposition api使えるのか不明

import { defineAsyncComponent, ref } from 'vue';
import type { Directive } from 'vue';
import { isTouchUsing } from '@/utility/touch.js';
import { popup, alert } from '@/os.js';

const start = isTouchUsing ? 'touchstart' : 'mouseenter';
const end = isTouchUsing ? 'touchend' : 'mouseleave';

type TooltipDirectiveState = {
	text: string | null | undefined;
	_close: null | (() => void);
	show: () => void;
	close: () => void;

	showTimer: number | null;
	hideTimer: number | null;
	checkTimer: number | null;
	dialogClickHandler?: (ev: MouseEvent) => void;
	selectstartHandler?: (ev: Event) => void;
	hoverStartHandler?: (ev: Event) => void;
	hoverEndHandler?: (ev: Event) => void;
};

const states = new WeakMap<HTMLElement, TooltipDirectiveState>();

type TooltipDirectiveModifiers = 'left' | 'right' | 'top' | 'bottom' | 'mfm' | 'noDelay';
type TooltipDirectiveArg = 'dialog';

export const tooltipDirective = {
	mounted(el, binding) {
		const delay = binding.modifiers.noDelay ? 0 : 100;

		const state = {
			text: binding.value,
			_close: null,
			showTimer: null,
			hideTimer: null,
			checkTimer: null,
		} as TooltipDirectiveState;

		state.close = () => {
			if (state._close) {
				if (state.checkTimer) window.clearInterval(state.checkTimer);
				state._close();
				state._close = null;
			}
		};

		if (binding.arg === 'dialog') {
			state.dialogClickHandler = (ev) => {
				if (binding.value == null) return;
				ev.preventDefault();
				ev.stopPropagation();
				alert({
					type: 'info',
					text: binding.value,
				});
				return false;
			};
			el.addEventListener('click', state.dialogClickHandler);
		}

		state.show = () => {
			if (!window.document.body.contains(el)) return;
			if (state._close) return;
			if (state.text == null) return;

			const showing = ref(true);
			const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkTooltip.vue')), {
				showing,
				text: state.text,
				asMfm: binding.modifiers.mfm,
				direction: binding.modifiers.left ? 'left' : binding.modifiers.right ? 'right' : binding.modifiers.top ? 'top' : binding.modifiers.bottom ? 'bottom' : 'top',
				anchorElement: el,
			}, {
				closed: () => dispose(),
			});

			state._close = () => {
				showing.value = false;
			};
		};

		state.selectstartHandler = (ev) => {
			ev.preventDefault();
		};

		state.hoverStartHandler = (ev) => {
			if (state.showTimer) window.clearTimeout(state.showTimer);
			if (state.hideTimer) window.clearTimeout(state.hideTimer);
			if (delay === 0) {
				state.show();
			} else {
				state.showTimer = window.setTimeout(state.show, delay);
			}
		};

		state.hoverEndHandler = (ev) => {
			if (state.showTimer) window.clearTimeout(state.showTimer);
			if (state.hideTimer) window.clearTimeout(state.hideTimer);
			if (delay === 0) {
				state.close();
			} else {
				state.hideTimer = window.setTimeout(state.close, delay);
			}
		};

		el.addEventListener(start, state.hoverStartHandler, { passive: true });
		el.addEventListener(end, state.hoverEndHandler, { passive: true });
		el.addEventListener('click', state.close, { passive: true });
		el.addEventListener('selectstart', state.selectstartHandler);

		states.set(el, state);
	},

	updated(el, binding) {
		const state = states.get(el);
		if (!state) return;
		state.text = binding.value;
	},

	beforeUnmount(el) {
		const state = states.get(el);
		if (!state) return;

		if (state.showTimer) window.clearTimeout(state.showTimer);
		if (state.hideTimer) window.clearTimeout(state.hideTimer);
		if (state.checkTimer) window.clearInterval(state.checkTimer);

		state.close();

		if (state.dialogClickHandler) el.removeEventListener('click', state.dialogClickHandler);
		if (state.hoverStartHandler) el.removeEventListener(start, state.hoverStartHandler);
		if (state.hoverEndHandler) el.removeEventListener(end, state.hoverEndHandler);
		if (state.selectstartHandler) el.removeEventListener('selectstart', state.selectstartHandler);

		states.delete(el);
	},
} as Directive<HTMLElement, string | null | undefined, TooltipDirectiveModifiers, TooltipDirectiveArg>;
