import { decode } from 'blurhash';

onmessage = async (event) => {
    if (!('hash' in event.data && typeof event.data.hash === 'string')) {
        return;
    }
    const width = event.data.width ?? 64;
    const height = event.data.height ?? 64;
    const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext!('2d');
    if (!ctx) return;
	const imageData = ctx.createImageData(width, height);
    const pixels = decode(event.data.hash, width, height);
	imageData.data.set(pixels);
	ctx.putImageData(imageData, 0, 0);
    const bitmap = canvas.transferToImageBitmap();
    postMessage(bitmap);
};
