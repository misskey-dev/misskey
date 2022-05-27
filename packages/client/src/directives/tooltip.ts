// TODO: useTooltip関数使うようにしたい
// ただディレクティブ内でonUnmountedなどのcomposition api使えるのか不明

import { defineAsyncComponent, Directive, ref } from 'vue';
import { isTouchUsing } from '@/scripts/touch';
import { popup, alert } from '@/os';

const start = isTouchUsing ? 'touchstart' : 'mouseover';
const end = isTouchUsing ? 'touchend' : 'mouseleave';
const delay = 100;

export default {
	mounted(el: HTMLElement, binding, vn) {
		const self = (el as any)._tooltipDirective_ = {} as any;

		self.text = binding.value as string;
		self._close = null;
		self.showTimer = null;
		self.hideTimer = null;
		self.checkTimer = null;

		self.close = () => {
			if (self._close) {
				window.clearInterval(self.checkTimer);
				self._close();
				self._close = null;
			}
		};

		if (binding.arg === 'dialog') {
			el.addEventListener('click', (ev) => {
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
			if (!document.body.contains(el)) return;
			if (self._close) return;
			if (self.text == null) return;

			const showing = ref(true);
			popup(defineAsyncComponent(() => import('@/components/ui/tooltip.vue')), {
				showing,
				text: self.text,
				targetElement: el,
			}, {}, 'closed');

			self._close = () => {
				showing.value = false;
			};
		};

		el.addEventListener('selectstart', ev => {
			ev.preventDefault();
		});

		el.addEventListener(start, () => {
			window.clearTimeout(self.showTimer);
			window.clearTimeout(self.hideTimer);
			self.showTimer = window.setTimeout(self.show, delay);
		}, { passive: true });

		el.addEventListener(end, () => {
			window.clearTimeout(self.showTimer);
			window.clearTimeout(self.hideTimer);
			self.hideTimer = window.setTimeout(self.close, delay);
		}, { passive: true });

		el.addEventListener('click', () => {
			window.clearTimeout(self.showTimer);
			self.close();
		});
	},

	updated(el, binding) {
		const self = el._tooltipDirective_;
		self.text = binding.value as string;
	},

	unmounted(el, binding, vn) {
		const self = el._tooltipDirective_;
		window.clearInterval(self.checkTimer);
	},
} as Directive;
