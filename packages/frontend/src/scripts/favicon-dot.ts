/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import tinycolor from 'tinycolor2';

class FavIconDot {
	private readonly canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D | null = null;
	private faviconImage: HTMLImageElement | null = null;
	private faviconEL: HTMLLinkElement | undefined;
	private hasLoaded: Promise<void> | undefined;

	constructor() {
		this.canvas = document.createElement('canvas');
	}

	/**
	 * Must be called before calling any other functions
	 */
	public async setup() {
		const element: HTMLLinkElement = await this.getOrMakeFaviconElement();

		this.faviconEL = element;
		this.ctx = this.canvas.getContext('2d');

		this.faviconImage = document.createElement('img');

		this.hasLoaded = new Promise((resolve, reject) => {
			(this.faviconImage as HTMLImageElement).addEventListener('load', () => {
				this.canvas.width = (this.faviconImage as HTMLImageElement).width;
				this.canvas.height = (this.faviconImage as HTMLImageElement).height;
				resolve();
			});
			(this.faviconImage as HTMLImageElement).addEventListener('error', () => {
				reject('Failed to create favicon img element');
			});
		});

		this.faviconImage.src = this.faviconEL.href;
	}

	private async getOrMakeFaviconElement(): Promise<HTMLLinkElement> {
		return new Promise((resolve, reject) => {
			const favicon = (document.querySelector('link[rel=icon]') ?? this.createFaviconElem()) as HTMLLinkElement;
			favicon.addEventListener('load', () => {
				resolve(favicon);
			});

			favicon.onerror = () => {
				reject('Failed to load favicon');
			};
			resolve(favicon);
		});
	}

	private createFaviconElem() {
		const newLink = document.createElement('link');
		newLink.setAttribute('rel', 'icon');
		newLink.setAttribute('href', '/favicon.ico');
		newLink.setAttribute('type', 'image/x-icon');

		document.head.appendChild(newLink);
		return newLink;
	}

	private drawIcon() {
		if (!this.ctx || !this.faviconImage) return;
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.drawImage(this.faviconImage, 0, 0, this.faviconImage.width, this.faviconImage.height);
	}

	private drawDot() {
		if (!this.ctx || !this.faviconImage) return;
		const radius = Math.min(this.faviconImage.width, this.faviconImage.height) / 6;
		const computedStyle = getComputedStyle(document.documentElement);

		// 元の画像を丸く切り抜く
		this.ctx.globalCompositeOperation = 'destination-out';
		this.ctx.beginPath();
		// 丸い部分の外側を描画（色付きの丸と同心円上に、右下にstrokeWidthだけはみ出させて描画）
		this.ctx.arc(this.canvas.width - radius, this.canvas.height - radius, radius * 1.5, 0, 2 * Math.PI);
		this.ctx.fill();
		this.ctx.closePath();

		// 丸い部分を描画
		this.ctx.globalCompositeOperation = 'source-over';
		this.ctx.beginPath();
		this.ctx.arc(this.canvas.width - radius, this.canvas.height - radius, radius, 0, 2 * Math.PI);
		this.ctx.fillStyle = tinycolor(computedStyle.getPropertyValue('--error') || '#ec4137').toHexString();
		this.ctx.fill();
		this.ctx.closePath();
	}

	private setFavicon() {
		if (this.faviconEL) this.faviconEL.href = this.canvas.toDataURL('image/png');
	}

	public async setVisible(isVisible: boolean) {
		// Wait for it to have loaded the icon
		await this.hasLoaded;
		this.drawIcon();
		if (isVisible) this.drawDot();
		this.setFavicon();
	}
}

let icon: FavIconDot | undefined = undefined;

export function setFavIconDot(visible: boolean) {
	const setIconVisibility = async () => {
		if (!icon) {
			icon = new FavIconDot();
			await icon.setup();
		}

		icon!.setVisible(visible);
	};

	// If document is already loaded, set visibility immediately
	if (document.readyState === 'complete') {
		setIconVisibility();
	} else {
		// Otherwise, set visibility when window loads
		window.addEventListener('load', setIconVisibility);
	}
}
