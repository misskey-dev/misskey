import * as bq from 'bee-queue';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as mongo from 'mongodb';

import { queueLogger } from '../logger';
import Note, { INote } from '../../models/note';
import addFile from '../../services/drive/add-file';
import User from '../../models/user';
import dateFormat = require('dateformat');

const logger = queueLogger.createSubLogger('export-notes');

export async function exportNotes(job: bq.Job, done: any): Promise<void> {
	logger.info(`Exporting notes of ${job.data.user._id} ...`);

	const user = await User.findOne({
		_id: new mongo.ObjectID(job.data.user._id.toString())
	});

	// Create temp file
	const [path, cleanup] = await new Promise<[string, any]>((res, rej) => {
		tmp.file((e, path, fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});

	logger.info(`Temp file is ${path}`);

	const stream = fs.createWriteStream(path, { flags: 'a' });

	await new Promise((res, rej) => {
		stream.write('[', err => {
			if (err) {
				logger.error(err);
				rej(err);
			} else {
				res();
			}
		});
	});

	let exportedNotesCount = 0;
	let ended = false;
	let cursor: any = null;

	while (!ended) {
		const notes = await Note.find({
			userId: user._id,
			...(cursor ? { _id: { $gt: cursor } } : {})
		}, {
			limit: 100,
			sort: {
				_id: 1
			}
		});

		if (notes.length === 0) {
			ended = true;
			if (job.reportProgress) job.reportProgress(100);
			break;
		}

		cursor = notes[notes.length - 1]._id;

		for (const note of notes) {
			const content = JSON.stringify(serialize(note));
			await new Promise((res, rej) => {
				stream.write(exportedNotesCount === 0 ? content : ',\n' + content, err => {
					if (err) {
						logger.error(err);
						rej(err);
					} else {
						res();
					}
				});
			});
			exportedNotesCount++;
		}

		const total = await Note.count({
			userId: user._id,
		});

		if (job.reportProgress) job.reportProgress(exportedNotesCount / total);
	}

	await new Promise((res, rej) => {
		stream.write(']', err => {
			if (err) {
				logger.error(err);
				rej(err);
			} else {
				res();
			}
		});
	});

	stream.end();
	logger.succ(`Exported to: ${path}`);

	const fileName = 'notes-' + dateFormat(new Date(), 'yyyy-mm-dd-HH-MM-ss') + '.json';
	const driveFile = await addFile(user, path, fileName);

	logger.succ(`Exported to: ${driveFile._id}`);
	cleanup();
	done();
}

function serialize(note: INote): any {
	return {
		id: note._id,
		text: note.text,
		createdAt: note.createdAt,
		fileIds: note.fileIds,
		replyId: note.replyId,
		renoteId: note.renoteId,
		poll: note.poll,
		cw: note.cw,
		viaMobile: note.viaMobile,
		visibility: note.visibility,
		visibleUserIds: note.visibleUserIds,
		appId: note.appId,
		geo: note.geo,
		localOnly: note.localOnly
	};
}
