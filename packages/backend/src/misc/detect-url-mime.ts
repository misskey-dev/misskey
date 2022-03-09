import { createTemp } from './create-temp.js';
import { downloadUrl } from './download-url.js';
import { detectType } from './get-file-info.js';

export async function detectUrlMime(url: string) {
	const [path, cleanup] = await createTemp();

	try {
		await downloadUrl(url, path);
		const { mime } = await detectType(path);
		return mime;
	} finally {
		cleanup();
	}
}
