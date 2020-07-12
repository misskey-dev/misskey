import * as fs from 'fs';
import * as util from 'util';
import Logger from '../services/logger';
import { createTemp } from './create-temp';
import { downloadUrl } from './download-url';

const logger = new Logger('download-text-file');

export async function downloadTextFile(url: string): Promise<string> {
	// Create temp file
	const [path, cleanup] = await createTemp();

	logger.info(`Temp file is ${path}`);

	try {
		// write content at URL to temp file
		await downloadUrl(url, path);

		const text = await util.promisify(fs.readFile)(path, 'utf8');

		return text;
	} finally {
		cleanup();
	}
}
