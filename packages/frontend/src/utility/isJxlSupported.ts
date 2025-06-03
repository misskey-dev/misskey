/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

let isJxlSupportedCache: boolean | undefined;
export function isJxlSupported() {
    if (isJxlSupportedCache === undefined) {
        const canvas = window.document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        isJxlSupportedCache = canvas.toDataURL('image/jxl').startsWith('data:image/jxl');
    }
    return isJxlSupportedCache;
}
