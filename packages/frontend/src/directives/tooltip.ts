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
	showTimer: number | null;
	hideTimer: number | null;
	checkTimer: number | null;
	show: () => void;
	close: () => void;
};

interface TooltipDirectiveElement extends HTMLElement {
	_tooltipDirective_?: TooltipDirectiveState;
}

type TooltipDirectiveModifiers = 'left' | 'right' | 'top' | 'bottom' | 'mfm' | 'noDelay';
type TooltipDirectiveArg = 'dialog';

export const tooltipDirective = {
	mounted(el, binding) {
		const delay = binding.modifiers.noDelay ? 0 : 100;

		const self = el._tooltipDirective_ = {} as TooltipDirectiveState;

		self.text = binding.value;
		self._close = null;
		self.showTimer = null;
		self.hideTimer = null;
		self.checkTimer = null;

		self.close = () => {
			if (self._close) {
				if (self.checkTimer) window.clearInterval(self.checkTimer);
				self._close();
				self._close = null;
			}
		};

		if (binding.arg === 'dialog') {
			el.addEventListener('click', (ev) => {
				if (binding.value == null) return;
				ev.preventDefault();
				ev.stopPropagation();
				alert({
					type: 'info',
					text: binding.value,
				});
				return false;
			});
		}

		self.show = () => {
			if (!window.document.body.contains(el)) return;
			if (self._close) return;
			if (self.text == null) return;

			const showing = ref(true);
			const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkTooltip.vue')), {
				showing,
				text: self.text,
				asMfm: binding.modifiers.mfm,
				direction: binding.modifiers.left ? 'left' : binding.modifiers.right ? 'right' : binding.modifiers.top ? 'top' : binding.modifiers.bottom ? 'bottom' : 'top',
				anchorElement: el,
			}, {
				closed: () => dispose(),
			});

			self._close = () => {
				showing.value = false;
			};
		};

		el.addEventListener('selectstart', ev => {
			ev.preventDefault();
		});

		el.addEventListener(start, (ev) => {
			if (self.showTimer) window.clearTimeout(self.showTimer);
			if (self.hideTimer) window.clearTimeout(self.hideTimer);
			if (delay === 0) {
				self.show();
			} else {
				self.showTimer = window.setTimeout(self.show, delay);
			}
		}, { passive: true });

		el.addEventListener(end, () => {
			if (self.showTimer) window.clearTimeout(self.showTimer);
			if (self.hideTimer) window.clearTimeout(self.hideTimer);
			if (delay === 0) {
				self.close();
			} else {
				self.hideTimer = window.setTimeout(self.close, delay);
			}
		}, { passive: true });

		el.addEventListener('click', () => {
			if (self.showTimer) window.clearTimeout(self.showTimer);
			self.close();
		});
	},

	updated(el, binding) {
		const self = el._tooltipDirective_;
		if (self == null) return;
		self.text = binding.value as string;
	},

	unmounted(el) {
		const self = el._tooltipDirective_;
		if (self == null) return;
		if (self.showTimer) window.clearTimeout(self.showTimer);
		if (self.hideTimer) window.clearTimeout(self.hideTimer);
		if (self.checkTimer) window.clearTimeout(self.checkTimer);
		self.close();
	},
} as Directive<TooltipDirectiveElement, string | null | undefined, TooltipDirectiveModifiers, TooltipDirectiveArg>;
