import { DriveFile } from '@/models/entities/drive-file';
import { InternalStorage } from './internal-storage';
import { DriveFiles, Instances, Notes, Users } from '@/models/index';
import { driveChart, perUserDriveChart, instanceChart } from '@/services/chart/index';
import { createDeleteObjectStorageFileJob } from '@/queue/index';
import { fetchMeta } from '@/misc/fetch-meta';
import { getS3 } from './s3';
import { v4 as uuid } from 'uuid';
import { Note } from '@/models/entities/note';
import { renderActivity } from '@/remote/activitypub/renderer/index';
import renderDelete from '@/remote/activitypub/renderer/delete';
import renderTombstone from '@/remote/activitypub/renderer/tombstone';
import config from '@/config/index';
import { deliverToFollowers } from '@/remote/activitypub/deliver-manager';
import { Brackets } from 'typeorm';
import { deliverToRelays } from '../relay';

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

		// TODO: トランザクション
		const relatedNotes = await findRelatedNotes(file.id);
		for (const relatedNote of relatedNotes) { // for each note with deleted driveFile
			const cascadingNotes = (await findCascadingNotes(relatedNote)).filter(note => !note.localOnly);
			for (const cascadingNote of cascadingNotes) { // for each notes subject to cascade deletion
				if (!cascadingNote.user) continue;
				if (!Users.isLocalUser(cascadingNote.user)) continue;
				const content = renderActivity(renderDelete(renderTombstone(`${config.url}/notes/${cascadingNote.id}`), cascadingNote.user));
				deliverToFollowers(cascadingNote.user, content); // federate delete msg
				deliverToRelays(cascadingNote.user, content);
			}
			if (!relatedNote.user) continue;
			if (Users.isLocalUser(relatedNote.user)) {
				const content = renderActivity(renderDelete(renderTombstone(`${config.url}/notes/${relatedNote.id}`), relatedNote.user));
				deliverToFollowers(relatedNote.user, content);
				deliverToRelays(relatedNote.user, content);
			}
		}
		Notes.createQueryBuilder().delete()
			.where(':id = ANY("fileIds")', { id: file.id })
			.execute();
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
