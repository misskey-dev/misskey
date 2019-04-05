import { createTemp } from './create-temp';
import { downloadUrl } from './donwload-url';
import { detectMine } from './detect-mine';

export async function detectUrlMine(url: string) {
	const [path, cleanup] = await createTemp();

	try {
		await downloadUrl(url, path);
		const [type] = await detectMine(path);
		return type;
	} finally {
		cleanup();
	}
}
