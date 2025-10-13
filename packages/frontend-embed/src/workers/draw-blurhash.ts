/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { render } from 'buraha';

const canvas = new OffscreenCanvas(64, 64);
const workerScope = self as unknown as {
	onmessage: (event: MessageEvent) => void;
	postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

workerScope.onmessage = (event) => {
	// console.log(event.data);
	if (!('id' in event.data && typeof event.data.id === 'string')) {
		return;
	}
	if (!('hash' in event.data && typeof event.data.hash === 'string')) {
		return;
	}

	render(event.data.hash, canvas);
	const bitmap = canvas.transferToImageBitmap();
	workerScope.postMessage({ id: event.data.id, bitmap }, [bitmap]);
};

export {};
