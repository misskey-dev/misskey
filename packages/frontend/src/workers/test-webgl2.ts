try {
    // throw ReferenceError in Safari <= 16.3
    const canvas = new OffscreenCanvas(1, 1);
    const gl = canvas.getContext('webgl2');
    if (gl) {
        postMessage({ result: true });
    } else {
        postMessage({ result: false });
    }
} catch (err) {
    // assert(e instanceof ReferenceError)
    postMessage({ result: false });
}
