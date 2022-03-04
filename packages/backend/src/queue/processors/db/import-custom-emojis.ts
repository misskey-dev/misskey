import Bull from 'bull';
import * as tmp from 'tmp';
import * as fs from 'node:fs';
import unzipper from 'unzipper';
import { getConnection } from 'typeorm';

import { queueLogger } from '../../logger.js';
import { downloadUrl } from '@/misc/download-url.js';
import { DriveFiles, Emojis } from '@/models/index.js';
import { DbUserImportJobData } from '@/queue/types.js';
import { addFile } from '@/services/drive/add-file.js';
import { genId } from '@/misc/gen-id.js';

const logger = queueLogger.createSubLogger('import-custom-emojis');

// TODO: 名前衝突時の動作を選べるようにする
export async function importCustomEmojis(job: Bull.Job<DbUserImportJobData>, done: any): Promise<void> {
	logger.info(`Importing custom emojis ...`);

	const file = await DriveFiles.findOne({
		id: job.data.fileId,
	});
	if (file == null) {
		done();
		return;
	}

	// Create temp dir
	const [path, cleanup] = await new Promise<[string, () => void]>((res, rej) => {
		tmp.dir((e, path, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	logger.info(`Temp dir is ${path}`);

	const destPath = path + '/emojis.zip';

	try {
		fs.writeFileSync(destPath, '', 'binary');
		await downloadUrl(file.url, destPath);
	} catch (e) { // TODO: 何度か再試行
		if (e instanceof Error || typeof e === 'string') {
			logger.error(e);
		}
		throw e;
	}

	const outputPath = path + '/emojis';
	const unzipStream = fs.createReadStream(destPath);
	const extractor = unzipper.Extract({ path: outputPath });
	extractor.on('close', async () => {
		const metaRaw = fs.readFileSync(outputPath + '/meta.json', 'utf-8');
		const meta = JSON.parse(metaRaw);

		for (const record of meta.emojis) {
			if (!record.downloaded) continue;
			const emojiInfo = record.emoji;
			const emojiPath = outputPath + '/' + record.fileName;
			await Emojis.delete({
				name: emojiInfo.name,
			});
			const driveFile = await addFile({ user: null, path: emojiPath, name: record.fileName, force: true });
			const emoji = await Emojis.insert({
				id: genId(),
				updatedAt: new Date(),
				name: emojiInfo.name,
				category: emojiInfo.category,
				host: null,
				aliases: emojiInfo.aliases,
				originalUrl: driveFile.url,
				publicUrl: driveFile.webpublicUrl ?? driveFile.url,
				type: driveFile.webpublicType ?? driveFile.type,
			}).then(x => Emojis.findOneOrFail(x.identifiers[0]));
		}

		await getConnection().queryResultCache!.remove(['meta_emojis']);

		cleanup();
	
		logger.succ('Imported');
		done();
	});
	unzipStream.pipe(extractor);
	logger.succ(`Unzipping to ${outputPath}`);
}
