import { Directive, ref } from 'vue';
import autobind from 'autobind-decorator';
import { popup } from '@/os';

export class UserPreview {
	private el;
	private user;
	private showTimer;
	private hideTimer;
	private checkTimer;
	private promise;

	constructor(el, user) {
		this.el = el;
		this.user = user;

		this.attach();
	}

	@autobind
	private show() {
		if (!document.body.contains(this.el)) return;
		if (this.promise) return;

		const showing = ref(true);

		popup(import('@/components/user-preview.vue'), {
			showing,
			q: this.user,
			source: this.el
		}, {
			mouseover: () => {
				clearTimeout(this.hideTimer);
			},
			mouseleave: () => {
				clearTimeout(this.showTimer);
				this.hideTimer = setTimeout(this.close, 500);
			},
		}, 'closed');

		this.promise = {
			cancel: () => {
				showing.value = false;
			}
		};

		this.checkTimer = setInterval(() => {
			if (!document.body.contains(this.el)) {
				clearTimeout(this.showTimer);
				clearTimeout(this.hideTimer);
				this.close();
			}
		}, 1000);
	}

	@autobind
	private close() {
		if (this.promise) {
			clearInterval(this.checkTimer);
			this.promise.cancel();
			this.promise = null;
		}
	}

	@autobind
	private onMouseover() {
		clearTimeout(this.showTimer);
		clearTimeout(this.hideTimer);
		this.showTimer = setTimeout(this.show, 500);
	}

	@autobind
	private onMouseleave() {
		clearTimeout(this.showTimer);
		clearTimeout(this.hideTimer);
		this.hideTimer = setTimeout(this.close, 500);
	}

	@autobind
	private onClick() {
		clearTimeout(this.showTimer);
		this.close();
	}

	@autobind
	public attach() {
		this.el.addEventListener('mouseover', this.onMouseover);
		this.el.addEventListener('mouseleave', this.onMouseleave);
		this.el.addEventListener('click', this.onClick);
	}

	@autobind
	public detach() {
		this.el.removeEventListener('mouseover', this.onMouseover);
		this.el.removeEventListener('mouseleave', this.onMouseleave);
		this.el.removeEventListener('click', this.onClick);
		clearInterval(this.checkTimer);
	}
}

export default {
	mounted(el: HTMLElement, binding, vn) {
		if (binding.value == null) return;

		// TODO: 新たにプロパティを作るのをやめMapを使う
		// ただメモリ的には↓の方が省メモリかもしれないので検討中
		const self = (el as any)._userPreviewDirective_ = {} as any;

		self.preview = new UserPreview(el, binding.value);
	},

	unmounted(el, binding, vn) {
		if (binding.value == null) return;

		const self = el._userPreviewDirective_;
		self.preview.detach();
	}
} as Directive;
