class FavIconDot {
	canvas : HTMLCanvasElement;
	src : string | null = null;
	ctx : CanvasRenderingContext2D | null = null;
	faviconImage : HTMLImageElement | null = null;
	faviconEL : HTMLLinkElement | undefined;
	hasLoaded : Promise<void> | undefined;

	constructor() {
		this.canvas = document.createElement('canvas');
	}

	//MUST BE CALLED BEFORE CALLING ANY OTHER FUNCTIONS
	public async setup() {
		const element : HTMLLinkElement = await this.getOrMakeFaviconElement();
		
		this.faviconEL = element;
		this.src = this.faviconEL.getAttribute('href');
		this.ctx = this.canvas.getContext('2d');
			
		this.faviconImage = document.createElement('img');
		this.faviconImage.src = this.faviconEL.href;
	
		this.hasLoaded = new Promise((resolve, reject) => {
			(this.faviconImage as HTMLImageElement).onload = () => {
				this.canvas.width = (this.faviconImage as HTMLImageElement).width;
				this.canvas.height = (this.faviconImage as HTMLImageElement).height;
				resolve();
			};
	
			(this.faviconImage as HTMLImageElement).onerror = () => {
				reject('Failed to create favicon img element');
			};
		});
	}

	private async getOrMakeFaviconElement() : Promise<HTMLLinkElement> {
		return new Promise((resolve, reject) => {
			const favicon = document.querySelector<HTMLLinkElement>('link[rel$=icon]') ?? this._createFaviconElem();
			if (favicon === document.querySelector<HTMLLinkElement>('link[rel$=icon]')) {
				favicon.onload = () => {
					resolve(favicon);
				};

				favicon.onerror = () => {
					reject('Failed to load favicon');
				};
			}
			resolve(favicon);
		});
	}

	private _createFaviconElem() {
		const newLink = document.createElement('link');
		newLink.rel = 'icon';
		newLink.href = '/favicon.ico';
		document.head.appendChild(newLink);
		return newLink;
	}

	private _drawIcon() {
		if (!this.ctx || !this.faviconImage) return;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(this.faviconImage, 0, 0, this.faviconImage.width, this.faviconImage.height);
	}

	private _drawDot() {
		if (!this.ctx || !this.faviconImage) return;
		this.ctx.beginPath();
		this.ctx.arc(this.faviconImage.width - 10, 10, 10, 0, 2 * Math.PI);
		this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--navIndicator');
		this.ctx.strokeStyle = 'white';
		this.ctx.fill();
		this.ctx.stroke();
	}

	private _setFavicon() {
		if (this.faviconEL) this.faviconEL.href = this.canvas.toDataURL('image/png');
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

let icon: FavIconDot | undefined = undefined;

export function setFavIconDot(visible: boolean) {
	const setIconVisibility = async () => {
		if (!icon) {
			icon = new FavIconDot();
			await icon.setup();
		}
		
		(icon as FavIconDot).setVisible(visible);
	};

	// If document is already loaded, set visibility immediately
	if (document.readyState === 'complete') {
		setIconVisibility();
	} else {
		// Otherwise, set visibility when window loads
		window.onload = setIconVisibility;
	}
}
