import { render } from 'buraha';

const canvases = new Map<string, OffscreenCanvas>();

onmessage = async (event) => {
    // console.log(event.data);
    if (!('id' in event.data && typeof event.data.id === 'string')) {
        return;
    }
    if (event.data.delete) {
        canvases.delete(event.data.id);
        return;
    }
    if (event.data.canvas) {
        canvases.set(event.data.id, event.data.canvas);
    }
    if (!('hash' in event.data && typeof event.data.hash === 'string')) {
        return;
    }
    const canvas = event.data.canvas ?? canvases.get(event.data.id);
    if (!canvas) {
        throw new Error('No canvas');
    }
    const work = new OffscreenCanvas(canvas.width, canvas.height);
    render(event.data.hash, work);
    const bitmap = await createImageBitmap(work);
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    postMessage({ result: true });
};
