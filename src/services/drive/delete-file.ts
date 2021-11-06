import { DriveFile } from '@/models/entities/drive-file';
import { InternalStorage } from './internal-storage';
import { DriveFiles, Instances, Notes, Users } from '@/models/index';
import { driveChart, perUserDriveChart, instanceChart } from '@/services/chart/index';
import { createDeleteObjectStorageFileJob } from '@/queue/index';
import { fetchMeta } from '@/misc/fetch-meta';
import { getS3 } from './s3';
import { v4 as uuid } from 'uuid';
import { Note } from '@/models/entities/note';
import { Brackets } from 'typeorm';

export async function deleteFile(file: DriveFile, isExpired = false) {
	if (file.storedInternal) {
		InternalStorage.del(file.accessKey!);

		if (file.thumbnailUrl) {
			InternalStorage.del(file.thumbnailAccessKey!);
		}

		if (file.webpublicUrl) {
			InternalStorage.del(file.webpublicAccessKey!);
		}
	} else if (!file.isLink) {
		createDeleteObjectStorageFileJob(file.accessKey!);

		if (file.thumbnailUrl) {
			createDeleteObjectStorageFileJob(file.thumbnailAccessKey!);
		}

		if (file.webpublicUrl) {
			createDeleteObjectStorageFileJob(file.webpublicAccessKey!);
		}
	}

	postProcess(file, isExpired);
}

export async function deleteFileSync(file: DriveFile, isExpired = false) {
	if (file.storedInternal) {
		InternalStorage.del(file.accessKey!);

		if (file.thumbnailUrl) {
			InternalStorage.del(file.thumbnailAccessKey!);
		}

		if (file.webpublicUrl) {
			InternalStorage.del(file.webpublicAccessKey!);
		}
	} else if (!file.isLink) {
		const promises = [];

		promises.push(deleteObjectStorageFile(file.accessKey!));

		if (file.thumbnailUrl) {
			promises.push(deleteObjectStorageFile(file.thumbnailAccessKey!));
		}

		if (file.webpublicUrl) {
			promises.push(deleteObjectStorageFile(file.webpublicAccessKey!));
		}

		await Promise.all(promises);
	}

	postProcess(file, isExpired);
}

async function postProcess(file: DriveFile, isExpired = false) {
	// リモートファイル期限切れ削除後は直リンクにする
	if (isExpired && file.userHost !== null && file.uri != null) {
		DriveFiles.update(file.id, {
			isLink: true,
			url: file.uri,
			thumbnailUrl: null,
			webpublicUrl: null,
			storedInternal: false,
			// ローカルプロキシ用
			accessKey: uuid(),
			thumbnailAccessKey: 'thumbnail-' + uuid(),
			webpublicAccessKey: 'webpublic-' + uuid(),
		});
	} else {
		DriveFiles.delete(file.id);
	}

	// 統計を更新
	driveChart.update(file, false);
	perUserDriveChart.update(file, false);
	if (file.userHost !== null) {
		instanceChart.updateDrive(file, false);
		Instances.decrement({ host: file.userHost }, 'driveUsage', file.size);
		Instances.decrement({ host: file.userHost }, 'driveFiles', 1);
	}
}

export async function deleteObjectStorageFile(key: string) {
	const meta = await fetchMeta();

	const s3 = getS3(meta);

	await s3.deleteObject({
		Bucket: meta.objectStorageBucket!,
		Key: key
	}).promise();
}

async function findRelatedNotes(fileId: string) {
	// NOTE: When running raw query, TypeORM converts field name to lowercase. Wrap in quotes to prevent conversion.
	const relatedNotes = await Notes.createQueryBuilder('note').where(':id = ANY("fileIds")', { id: fileId }).getMany();
	for (const relatedNote of relatedNotes) {
		const user = await Users.findOne({ id: relatedNote.userId });
		if (user)
			relatedNote.user = user;
	}
	return relatedNotes;
}

async function findCascadingNotes(note: Note) {
	const cascadingNotes: Note[] = [];

	const recursive = async (noteId: string) => {
		const query = Notes.createQueryBuilder('note')
			.where('note.replyId = :noteId', { noteId })
			.orWhere(new Brackets(q => {
				q.where('note.renoteId = :noteId', { noteId })
				.andWhere('note.text IS NOT NULL');
			}))
			.leftJoinAndSelect('note.user', 'user');
		const replies = await query.getMany();
		for (const reply of replies) {
			cascadingNotes.push(reply);
			await recursive(reply.id);
		}
	};
	await recursive(note.id);

	return cascadingNotes.filter(note => note.userHost === null); // filter out non-local users
}
