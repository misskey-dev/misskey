/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { qrcode } from 'etiket/qr';
import type { QRCodeOptions, QRCodeSVGOptions, CornerOptions } from 'etiket/qr';

const qrCornerOptions: CornerOptions = {
	outerShape: 'extra-rounded',
	innerShape: 'dots',
};

export const qrOptions: QRCodeOptions & QRCodeSVGOptions = {
	margin: 0,
	size: 300,
	color: 'currentColor',
	dotType: 'dots',
	corners: {
		topLeft: qrCornerOptions,
		topRight: qrCornerOptions,
		bottomLeft: qrCornerOptions,
	},
};

export async function qrcodeImageBitmap(text: string, options: QRCodeOptions & QRCodeSVGOptions & { size: number }): Promise<ImageBitmap> {
	const svgUrl = URL.createObjectURL(new Blob([qrcode(text, options)], { type: 'image/svg+xml' }));
	try {
		const img = new Image();
		img.src = svgUrl;
		await img.decode();

		const canvas = new OffscreenCanvas(options.size, options.size);
		const ctx = canvas.getContext('2d');
		if (ctx == null) throw new Error('Failed to get 2d context');
		ctx.drawImage(img, 0, 0, options.size, options.size);
		return canvas.transferToImageBitmap();
	} finally {
		URL.revokeObjectURL(svgUrl);
	}
}
