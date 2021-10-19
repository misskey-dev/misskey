import Logger from '@/services/logger';
import { getUrl } from './download-url';

const logger = new Logger('download-text-file');

export async function downloadTextFile(url: string): Promise<string> {
	const chunks = [];
	for await (const chunk of getUrl(url)) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString();
}
