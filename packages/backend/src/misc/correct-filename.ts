// 与えられた拡張子とファイル名が一致しているかどうかを確認し、
// 一致していない場合は拡張子を付与して返す
export function correctFilename(filename: string, ext: string | null) {
    const dotExt = ext ? ext.startsWith('.') ? ext : `.${ext}` : '.unknown';
    if (filename.endsWith(dotExt)) {
        return filename;
    }
    if (ext === 'jpg' && filename.endsWith('.jpeg')) {
        return filename;
    }
    if (ext === 'tif' && filename.endsWith('.tiff')) {
        return filename;
    }
    return `${filename}${dotExt}`;
}
