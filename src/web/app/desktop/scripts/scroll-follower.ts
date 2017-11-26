/**
 * 要素をスクロールに追従させる
 */
export default class ScrollFollower {
	private follower: Element;
	private containerTop: number;
	private topPadding: number;

	constructor(follower: Element, topPadding: number) {
		//#region
		this.follow = this.follow.bind(this);
		//#endregion

		this.follower = follower;
		this.containerTop = follower.getBoundingClientRect().top;
		this.topPadding = topPadding;

		window.addEventListener('scroll', this.follow);
		window.addEventListener('resize', this.follow);
	}

	/**
	 * 追従解除
	 */
	public dispose() {
		window.removeEventListener('scroll', this.follow);
		window.removeEventListener('resize', this.follow);
	}

	private follow() {
		const windowBottom = window.scrollY + window.innerHeight;
		const windowTop = window.scrollY + this.topPadding;

		const rect = this.follower.getBoundingClientRect();
		const followerBottom = (rect.top + window.scrollY) + rect.height;
		const screenHeight = window.innerHeight - this.topPadding;

		// スクロールの上部(+余白)がフォロワーコンテナの上部よりも上方にある
		if (window.scrollY + this.topPadding < this.containerTop) {
			// フォロワーをコンテナの最上部に合わせる
			(this.follower.parentNode as any).style.marginTop = '0px';
			return;
		}

		// スクロールの下部がフォロワーの下部よりも下方にある かつ 表示領域の縦幅がフォロワーの縦幅よりも狭い
		if (windowBottom > followerBottom && rect.height > screenHeight) {
			// フォロワーの下部をスクロール下部に合わせる
			const top = (windowBottom - rect.height) - this.containerTop;
			(this.follower.parentNode as any).style.marginTop = `${top}px`;
			return;
		}

		// スクロールの上部(+余白)がフォロワーの上部よりも上方にある または 表示領域の縦幅がフォロワーの縦幅よりも広い
		if (windowTop < rect.top + window.scrollY || rect.height < screenHeight) {
			// フォロワーの上部をスクロール上部(+余白)に合わせる
			const top = windowTop - this.containerTop;
			(this.follower.parentNode as any).style.marginTop = `${top}px`;
			return;
		}
	}
}
