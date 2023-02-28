export function correctFilename(filename: string, ext: string | null) {
    const dotExt = ext ? `.${ext}` : '.unknown';
    if (filename.endsWith(dotExt)) {
        return filename;
    }
    if (ext === 'jpg' && filename.endsWith('.jpeg')) {
        return filename;
    }
    return `${filename}${dotExt}`;
}
