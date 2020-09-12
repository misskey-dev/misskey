import { Directive } from 'vue';
import MkUserPreview from '@/components/user-preview.vue';

export default {
	// modal側でcontentのmouseoverイベントなどを発行してもらう必要がありそう
	/*
	mounted(el: HTMLElement, binding, vn) {
		// TODO: 新たにプロパティを作るのをやめMapを使う
		// ただメモリ的には↓の方が省メモリかもしれないので検討中
		const self = (el as any)._userPreviewDirective_ = {} as any;

		self.user = binding.value;
		self.close = null;
		self.showTimer = null;
		self.hideTimer = null;
		self.checkTimer = null;

		self.close = () => {
			if (self.close) {
				clearInterval(self.checkTimer);
				self.close.close();
				self.close = null;
			}
		};

		const show = () => {
			if (!document.body.contains(el)) return;
			if (self.close) return;

			self.close = os.popup(MkUserPreview, {
				user: self.user,
			}, null, {
				source: el
			});

			self.close.$on('mouseover', () => {
				clearTimeout(self.hideTimer);
			});

			self.close.$on('mouseleave', () => {
				clearTimeout(self.showTimer);
				self.hideTimer = setTimeout(self.close, 500);
			});

			self.checkTimer = setInterval(() => {
				if (!document.body.contains(el)) {
					clearTimeout(self.showTimer);
					clearTimeout(self.hideTimer);
					self.close();
				}
			}, 1000);
		};

		el.addEventListener('mouseover', () => {
			clearTimeout(self.showTimer);
			clearTimeout(self.hideTimer);
			self.showTimer = setTimeout(show, 500);
		});

		el.addEventListener('mouseleave', () => {
			clearTimeout(self.showTimer);
			clearTimeout(self.hideTimer);
			self.hideTimer = setTimeout(self.close, 500);
		});

		el.addEventListener('click', () => {
			clearTimeout(self.showTimer);
			self.close();
		});
	},

	unmounted(el, binding, vn) {
		const self = el._userPreviewDirective_;
		clearInterval(self.checkTimer);
	}*/
} as Directive;
