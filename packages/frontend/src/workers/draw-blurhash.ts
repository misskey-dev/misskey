import { render } from 'buraha';

let canvas: OffscreenCanvas;

onmessage = async (event) => {
    console.log(event.data);
    if (!('hash' in event.data && typeof event.data.hash === 'string')) {
        return;
    }

    if (event.data.canvas) {
        canvas = event.data.canvas;
    }
    if (!canvas) {
        throw new Error('No canvas');
    }
    render(event.data.hash, canvas);
    postMessage({ result: true });
};
