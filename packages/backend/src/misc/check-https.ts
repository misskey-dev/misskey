export function checkHttps(url: string) {
    return url.startsWith('https://') ||
        (url.startsWith('http://') && process.env.NODE_ENV !== 'production');
}
