import MkUserPreview from '../components/user-preview.vue';

export default {
	bind(el: HTMLElement, binding, vn) {
		const self = (el as any)._userPreviewDirective_ = {} as any;

		self.user = binding.value;
		self.tag = null;
		self.showTimer = null;
		self.hideTimer = null;
		self.checkTimer = null;

		self.close = () => {
			if (self.tag) {
				clearInterval(self.checkTimer);
				self.tag.close();
				self.tag = null;
			}
		};

		const show = () => {
			if (!document.body.contains(el)) return;
			if (self.tag) return;

			self.tag = new MkUserPreview({
				parent: vn.context,
				propsData: {
					user: self.user,
					source: el
				}
			}).$mount();

			self.tag.$on('mouseover', () => {
				clearTimeout(self.hideTimer);
			});

			self.tag.$on('mouseleave', () => {
				clearTimeout(self.showTimer);
				self.hideTimer = setTimeout(self.close, 500);
			});

			self.checkTimer = setInterval(() => {
				if (!document.body.contains(el)) self.close();
			}, 1000);

			document.body.appendChild(self.tag.$el);
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

	unbind(el, binding, vn) {
		const self = el._userPreviewDirective_;
		clearTimeout(self.showTimer);
		clearTimeout(self.hideTimer);
		clearInterval(self.checkTimer);
		self.close();
	}
};
