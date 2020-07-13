export class StickySidebar {
	private lastScrollTop = 0;
	private el: HTMLElement;
	private spacer: HTMLElement;
	private marginTop: number;
	private isTop = false;
	private isBottom = false;

	constructor(el: StickySidebar['el'], spacer: StickySidebar['spacer'], marginTop = 0) {
		this.el = el;
		this.spacer = spacer;
		this.marginTop = marginTop;
	}

	public calc(scrollTop: number) {
		if (scrollTop > this.lastScrollTop) { // downscroll
			const overflow = this.el.clientHeight - window.innerHeight;
			this.el.style.bottom = null;
			this.el.style.top = `${-overflow}px`;

			this.isBottom = (scrollTop + window.innerHeight) >= (this.el.offsetTop + this.el.clientHeight);

			if (this.isTop) {
				this.isTop = false;
				this.spacer.style.marginTop = `${this.lastScrollTop}px`;
			}
		} else { // upscroll
			const overflow = this.el.clientHeight - window.innerHeight;
			this.el.style.top = null;
			this.el.style.bottom = `${-overflow - this.marginTop}px`;

			this.isTop = scrollTop <= this.el.offsetTop;

			if (this.isBottom) {
				this.isBottom = false;
				const overflow = this.el.clientHeight - window.innerHeight;
				this.spacer.style.marginTop = `${this.lastScrollTop - (overflow + this.marginTop)}px`;
			}
		}

		this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
	}
}
