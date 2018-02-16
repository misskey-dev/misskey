import MkUserPreview from '../components/user-preview.vue';

export default {
	bind(el, binding, vn) {
		const self = vn.context._userPreviewDirective_ = {} as any;

		self.user = binding.value;

		let tag = null;
		self.showTimer = null;
		self.hideTimer = null;

		self.close = () => {
			if (tag) {
				tag.close();
				tag = null;
			}
		};

		const show = () => {
			if (tag) return;
			tag = new MkUserPreview({
				parent: vn.context,
				propsData: {
					user: self.user
				}
			}).$mount();
			const preview = tag.$el;
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
		const self = vn.context._userPreviewDirective_;
		console.log('unbound:', self.user);
		clearTimeout(self.showTimer);
		clearTimeout(self.hideTimer);
		self.close();
	}
};
