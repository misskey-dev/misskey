import * as fs from 'fs';
import fileType = require('file-type');
import checkSvg from '../misc/check-svg';

export async function detectMine(path: string) {
	return new Promise<[string, string | null]>((res, rej) => {
		const readable = fs.createReadStream(path);
		readable
			.on('error', rej)
			.once('data', (buffer: Buffer) => {
				readable.destroy();
				const type = fileType(buffer);
				if (type) {
					if (type.mime == 'application/xml' && checkSvg(path)) {
						res(['image/svg+xml', 'svg']);
					} else {
						res([type.mime, type.ext]);
					}
				} else if (checkSvg(path)) {
					res(['image/svg+xml', 'svg']);
				} else {
					// 種類が同定できなかったら application/octet-stream にする
					res(['application/octet-stream', null]);
				}
			})
			.on('end', () => {
				// maybe 0 bytes
				res(['application/octet-stream', null]);
			});
	});
}
