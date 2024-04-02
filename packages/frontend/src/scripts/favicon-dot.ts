class FavIconDot {
	canvas : HTMLCanvasElement;
	src : string | null = null;
	ctx : CanvasRenderingContext2D | null = null;
	favconImage : HTMLImageElement | null = null;
	faviconEL : HTMLLinkElement;
	hasLoaded : Promise<void>;

	constructor() {
		this.canvas = document.createElement('canvas');
		this.faviconEL = document.querySelector<HTMLLinkElement>('link[rel$=icon]') ?? this._createFaviconElem();

		this.src = this.faviconEL.getAttribute('href');
		this.ctx = this.canvas.getContext('2d');
		
		this.favconImage = document.createElement('img');
		this.hasLoaded = new Promise((resolve, _reject) => {
			if (this.favconImage != null) {
				this.favconImage.onload = () => {
					this.canvas.width = (this.favconImage as HTMLImageElement).width;
					this.canvas.height = (this.favconImage as HTMLImageElement).height;
					// resolve();
					setTimeout(() => resolve(), 200);
				};
			}
		});
		this.favconImage.src = this.faviconEL.href;
	}

	private _createFaviconElem() {
		const newLink = document.createElement('link');
		newLink.rel = 'icon';
		newLink.href = '/favicon.ico';
		document.head.appendChild(newLink);
		return newLink;
	}

	private _drawIcon() {
		if (!this.ctx || !this.favconImage) return;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(this.favconImage, 0, 0, this.favconImage.width, this.favconImage.height);
	}

	private _drawDot() {
		if (!this.ctx || !this.favconImage) return;
		this.ctx.beginPath();
		this.ctx.arc(this.favconImage.width - 10, 10, 10, 0, 2 * Math.PI);
		this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--navIndicator');
		this.ctx.strokeStyle = 'white';
		this.ctx.fill();
		this.ctx.stroke();
	}

	private _setFavicon() {
		this.faviconEL.href = this.canvas.toDataURL('image/png');
	}

	async setVisible(isVisible : boolean) {
		//Wait for it to have loaded the icon
		await this.hasLoaded;
		console.log(this.hasLoaded);
		this._drawIcon();
		if (isVisible) this._drawDot();
		this._setFavicon();
	}
}

let icon: FavIconDot = new FavIconDot();

export function setFavIconDot(visible: boolean) {
	if (!icon) {
		icon = new FavIconDot();
	}
	icon.setVisible(visible);
}
