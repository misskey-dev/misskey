import { createTemp } from './create-temp';
import { downloadUrl } from './download-url';
import { detectType } from './get-file-info';

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
