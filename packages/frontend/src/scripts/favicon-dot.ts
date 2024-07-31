/*
 * SPDX-FileCopyrightText: leah and sharkey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import tinycolor from 'tinycolor2';

class FaviconDot {
	private readonly canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D | null = null;
	private faviconImage: HTMLImageElement | null = null;
	private faviconEl: HTMLLinkElement | undefined;
	private hasLoaded: Promise<void> | undefined;

	constructor() {
		this.canvas = document.createElement('canvas');
	}

	/**
	 * Must be called before calling any other functions
	 */
	public async setup() {
		const element: HTMLLinkElement = await this.getOrMakeFaviconEl();

		this.faviconEl = element;
		this.ctx = this.canvas.getContext('2d');

		this.faviconImage = document.createElement('img');

		this.hasLoaded = new Promise((resolve, reject) => {
			if (!this.faviconImage) {
				reject('Failed to create favicon img element');
				return;
			}

			this.faviconImage.addEventListener('load', () => {
				this.canvas.width = this.faviconImage!.width;
				this.canvas.height = this.faviconImage!.height;
				resolve();
			});
			this.faviconImage.addEventListener('error', () => {
				reject('Failed to create favicon img element');
			});
		});

		this.faviconImage.src = this.faviconEl.href;
	}

	private async getOrMakeFaviconEl(): Promise<HTMLLinkElement> {
		return new Promise((resolve, reject) => {
			const favicon = document.querySelector<HTMLLinkElement>('link[rel=icon]') ?? this.createFaviconEl();
			favicon.addEventListener('load', () => {
				resolve(favicon);
			});

			favicon.onerror = () => {
				reject('Failed to load favicon');
			};
			resolve(favicon);
		});
	}

	private createFaviconEl() {
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
		this.ctx.arc(this.canvas.width - radius, this.canvas.height - radius, radius * 1.5, 0, 2 * Math.PI);
		this.ctx.closePath();
		this.ctx.fill();

		// 丸い部分を描画
		this.ctx.globalCompositeOperation = 'source-over';
		this.ctx.beginPath();
		this.ctx.arc(this.canvas.width - radius, this.canvas.height - radius, radius, 0, 2 * Math.PI);
		this.ctx.fillStyle = tinycolor(computedStyle.getPropertyValue('--faviconDotColor') || '#ec4137').toHexString();
		this.ctx.closePath();
		this.ctx.fill();
	}

	private setFavicon() {
		if (this.faviconEl) this.faviconEl.href = this.canvas.toDataURL('image/png');
	}

	public async setVisible(isVisible: boolean) {
		// Wait for it to have loaded the icon
		await this.hasLoaded;
		this.drawIcon();
		if (isVisible) this.drawDot();
		this.setFavicon();
	}
}

let icon: FaviconDot | undefined = undefined;

export function setFaviconDot(visible: boolean) {
	const setIconVisibility = async () => {
		if (!icon) {
			icon = new FaviconDot();
			await icon.setup();
		}
		try {
			icon!.setVisible(visible);
		} catch (err) {
			// do nothing
		}
	};

	// If document is already loaded, set visibility immediately
	if (document.readyState === 'complete') {
		setIconVisibility();
	} else {
		// Otherwise, set visibility when window loads
		window.addEventListener('load', setIconVisibility);
	}
}
