/**
 * マウスオーバーするとユーザーがプレビューされる要素を設定します
 */

import MkUserPreview from '../components/user-preview.vue';

export default {
	bind(el, binding, vn) {
		const self = el._userPreviewDirective_ = {} as any;

		self.user = binding.value;
		self.tag = null;
		self.showTimer = null;
		self.hideTimer = null;

		self.close = () => {
			if (self.tag) {
				self.tag.close();
				self.tag = null;
			}
		};

		const show = () => {
			if (self.tag) return;

			self.tag = new MkUserPreview({
				parent: vn.context,
				propsData: {
					user: self.user
				}
			}).$mount();

			const preview = self.tag.$el;
			const rect = el.getBoundingClientRect();
			const x = rect.left + el.offsetWidth + window.pageXOffset;
			const y = rect.top + window.pageYOffset;

			preview.style.top = y + 'px';
			preview.style.left = x + 'px';

			preview.addEventListener('mouseover', () => {
				clearTimeout(self.hideTimer);
			});

			preview.addEventListener('mouseleave', () => {
				clearTimeout(self.showTimer);
				self.hideTimer = setTimeout(self.close, 500);
			});

			document.body.appendChild(preview);
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
	},

	unbind(el, binding, vn) {
		const self = el._userPreviewDirective_;
		clearTimeout(self.showTimer);
		clearTimeout(self.hideTimer);
		self.close();
	}
};
