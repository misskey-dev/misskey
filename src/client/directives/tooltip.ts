import MkTooltip from '../components/ui/tooltip.vue';
import { isDeviceTouch } from '../scripts/is-device-touch';

const start = isDeviceTouch ? 'touchstart' : 'mouseover';
const end = isDeviceTouch ? 'touchend' : 'mouseleave';

export default {
	bind(el: HTMLElement, binding, vn) {
		const self = (el as any)._tooltipDirective_ = {} as any;

		self.text = binding.value as string;
		self.tag = null;
		self.showTimer = null;
		self.hideTimer = null;
		self.checkTimer = null;

		console.log(['bind', el, self, self.text, vn])

		self.close = () => {
			if (self.tag) {
				clearInterval(self.checkTimer);
				self.tag.close();
				self.tag = null;
			}
		};

		const show = e => {
			console.log('あうー')
			if (!document.body.contains(el)) return;
			if (self.tag) return;

			self.tag = new MkTooltip({
				parent: vn.context,
				propsData: {
					text: self.text,
					source: el
				}
			}).$mount();

			console.log(self.tag)
		};

		el.addEventListener(start, () => {
			console.log('うん')
			clearTimeout(self.showTimer);
			clearTimeout(self.hideTimer);
			self.showTimer = setTimeout(show, 300);
		});

		el.addEventListener(end, () => {
			console.log('すん')
			clearTimeout(self.showTimer);
			clearTimeout(self.hideTimer);
			self.hideTimer = setTimeout(self.close, 300);
		});

		el.addEventListener('click', () => {
			clearTimeout(self.showTimer);
			self.close();
		});
	},

	unbind(el, binding, vn) {
		const self = el._tooltipDirective_;
		clearInterval(self.checkTimer);
	},
};
