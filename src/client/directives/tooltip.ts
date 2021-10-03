import { Directive, ref } from 'vue';
import { isDeviceTouch } from '@client/scripts/is-device-touch';
import { popup, dialog } from '@client/os';

const start = isDeviceTouch ? 'touchstart' : 'mouseover';
const end = isDeviceTouch ? 'touchend' : 'mouseleave';
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
				clearInterval(self.checkTimer);
				self._close();
				self._close = null;
			}
		};

		if (binding.arg === 'dialog') {
			el.addEventListener('click', (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				dialog({
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
			popup(import('@client/components/ui/tooltip.vue'), {
				showing,
				text: self.text,
				source: el
			}, {}, 'closed');

			self._close = () => {
				showing.value = false;
			};
		};

		el.addEventListener('selectstart', e => {
			e.preventDefault();
		});

		el.addEventListener(start, () => {
			clearTimeout(self.showTimer);
			clearTimeout(self.hideTimer);
			self.showTimer = setTimeout(self.show, delay);
		}, { passive: true });

		el.addEventListener(end, () => {
			clearTimeout(self.showTimer);
			clearTimeout(self.hideTimer);
			self.hideTimer = setTimeout(self.close, delay);
		}, { passive: true });

		el.addEventListener('click', () => {
			clearTimeout(self.showTimer);
			self.close();
		});
	},

	updated(el, binding) {
		const self = el._tooltipDirective_;
		self.text = binding.value as string;
	},

	unmounted(el, binding, vn) {
		const self = el._tooltipDirective_;
		clearInterval(self.checkTimer);
	},
} as Directive;
