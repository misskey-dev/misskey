import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as crypto from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { ZipReader } from 'slacc';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, DriveFilesRepository, MiDriveFile, MiNote, NotesRepository, MiUser, DriveFoldersRepository, MiDriveFolder } from '@/models/_.js';
import type Logger from '@/logger.js';
import { DownloadService } from '@/core/DownloadService.js';
import { bindThis } from '@/decorators.js';
import { QueueService } from '@/core/QueueService.js';
import { createTemp, createTempDir } from '@/misc/create-temp.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { DriveService } from '@/core/DriveService.js';
import { MfmService } from '@/core/MfmService.js';
import { ApNoteService } from '@/core/activitypub/models/ApNoteService.js';
import { extractApHashtagObjects } from '@/core/activitypub/models/tag.js';
import { IdService } from '@/core/IdService.js';
import type { Config } from '@/config.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type * as Bull from 'bullmq';
import type { DbNoteImportToDbJobData, DbNoteImportJobData, DbNoteWithParentImportToDbJobData } from '../types.js';

@Injectable()
export class ImportNotesProcessorService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private queueService: QueueService,
		private noteCreateService: NoteCreateService,
		private mfmService: MfmService,
		private apNoteService: ApNoteService,
		private driveService: DriveService,
		private downloadService: DownloadService,
		private idService: IdService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('import-notes');
	}

	@bindThis
	private async uploadFiles(dir: string, user: MiUser, folder?: MiDriveFolder['id']) {
		const fileList = await fsp.readdir(dir);
		for await (const file of fileList) {
			const name = `${dir}/${file}`;
			if (fs.statSync(name).isDirectory()) {
				await this.uploadFiles(name, user, folder);
			} else {
				const exists = await this.driveFilesRepository.findOneBy({ name: file, userId: user.id, folderId: folder });

				if (file.endsWith('.srt')) return;

				if (!exists) {
					await this.driveService.addFile({
						user: user,
						path: name,
						name: file,
						folderId: folder,
					});
				}
			}
		}
	}

	@bindThis
	private downloadUrl(url: string, path:string): Promise<{filename: string}> {
		return this.downloadService.downloadUrl(url, path, { operationTimeout: this.config.import?.downloadTimeout, maxSize: this.config.import?.maxFileSize });
	}

	@bindThis
	private async recreateChain(idFieldPath: string[], replyFieldPath: string[], arr: any[], includeOrphans: boolean): Promise<any[]> {
		type NotesMap = {
			[id: string]: any;
		};
		const notesTree: any[] = [];
		const noteById: NotesMap = {};
		const notesWaitingForParent: NotesMap = {};

		for await (const note of arr) {
			const noteId = idFieldPath.reduce(
				(obj, step) => obj[step],
				note,
			);

			noteById[noteId] = note;
			note.childNotes = [];

			const children = notesWaitingForParent[noteId];
			if (children) {
				note.childNotes.push(...children);
				delete notesWaitingForParent[noteId];
			}

			const noteReplyId = replyFieldPath.reduce(
				(obj, step) => obj[step],
				note,
			);
			if (noteReplyId == null) {
				notesTree.push(note);
				continue;
			}

			const parent = noteById[noteReplyId];
			if (parent) {
				parent.childNotes.push(note);
			} else {
				notesWaitingForParent[noteReplyId] ||= [];
				notesWaitingForParent[noteReplyId].push(note);
			}
		}

		if (includeOrphans) {
			notesTree.push(...Object.values(notesWaitingForParent).flat(1));
		}

		return notesTree;
	}

	@bindThis
	private isIterable(obj: any) {
		if (obj == null) {
			return false;
		}
		return typeof obj[Symbol.iterator] === 'function';
	}

	@bindThis
	private parseTwitterFile(str : string) : { tweet: object }[] {
		const jsonStr = str.replace(/^\s*window\.YTD\.tweets\.part0\s*=\s*/, '');

		try {
			return JSON.parse(jsonStr);
		} catch (error) {
			//The format is not what we expected. Either this file was tampered with or twitters exports changed
			this.logger.warn('Failed to import twitter notes due to malformed file');
			throw error;
		}
	}

	@bindThis
	public async process(job: Bull.Job<DbNoteImportJobData>): Promise<void> {
		this.logger.info(`Starting note import of ${job.data.user.id} ...`);

		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		const file = await this.driveFilesRepository.findOneBy({
			id: job.data.fileId,
		});
		if (file == null) {
			return;
		}

		let folder = await this.driveFoldersRepository.findOneBy({ name: 'Imports', userId: job.data.user.id });
		if (folder == null) {
			await this.driveFoldersRepository.insert({ id: this.idService.gen(), name: 'Imports', userId: job.data.user.id });
			folder = await this.driveFoldersRepository.findOneBy({ name: 'Imports', userId: job.data.user.id });
		}

		const type = job.data.type;

		if (type === 'Twitter' || file.name.startsWith('twitter') && file.name.endsWith('.zip')) {
			const [path, cleanup] = await createTempDir();

			this.logger.info(`Temp dir is ${path}`);

			const destPath = path + '/twitter.zip';

			try {
				await fsp.writeFile(destPath, '', 'binary');
				await this.downloadUrl(file.url, destPath);
			} catch (e) { // TODO: 何度か再試行
				if (e instanceof Error || typeof e === 'string') {
					this.logger.error(e);
				}
				throw e;
			}

			const outputPath = path + '/twitter';
			try {
				this.logger.succ(`Unzipping to ${outputPath}`);
				ZipReader.withDestinationPath(outputPath).viaBuffer(await fsp.readFile(destPath));

				const unprocessedTweets = this.parseTwitterFile(await fsp.readFile(outputPath + '/data/tweets.js', 'utf-8'));

				const tweets = unprocessedTweets.map(e => e.tweet);
				const processedTweets = await this.recreateChain(['id_str'], ['in_reply_to_status_id_str'], tweets, false);
				this.queueService.createImportTweetsToDbJob(job.data.user, processedTweets, null);
			} finally {
				cleanup();
			}
		} else if (type === 'Facebook' || file.name.startsWith('facebook-') && file.name.endsWith('.zip')) {
			const [path, cleanup] = await createTempDir();

			this.logger.info(`Temp dir is ${path}`);

			const destPath = path + '/facebook.zip';

			try {
				await fsp.writeFile(destPath, '', 'binary');
				await this.downloadUrl(file.url, destPath);
			} catch (e) { // TODO: 何度か再試行
				if (e instanceof Error || typeof e === 'string') {
					this.logger.error(e);
				}
				throw e;
			}

			const outputPath = path + '/facebook';
			try {
				this.logger.succ(`Unzipping to ${outputPath}`);
				ZipReader.withDestinationPath(outputPath).viaBuffer(await fsp.readFile(destPath));
				const postsJson = await fsp.readFile(outputPath + '/your_activity_across_facebook/posts/your_posts__check_ins__photos_and_videos_1.json', 'utf-8');
				const posts = JSON.parse(postsJson);
				const facebookFolder = await this.driveFoldersRepository.findOneBy({ name: 'Facebook', userId: job.data.user.id, parentId: folder?.id });
				if (facebookFolder == null && folder) {
					await this.driveFoldersRepository.insert({ id: this.idService.gen(), name: 'Facebook', userId: job.data.user.id, parentId: folder.id });
					const createdFolder = await this.driveFoldersRepository.findOneBy({ name: 'Facebook', userId: job.data.user.id, parentId: folder.id });
					if (createdFolder) await this.uploadFiles(outputPath + '/your_activity_across_facebook/posts/media', user, createdFolder.id);
				}
				this.queueService.createImportFBToDbJob(job.data.user, posts);
			} finally {
				cleanup();
			}
		} else if (file.name.endsWith('.zip')) {
			const [path, cleanup] = await createTempDir();

			this.logger.info(`Temp dir is ${path}`);

			const destPath = path + '/unknown.zip';

			try {
				await fsp.writeFile(destPath, '', 'binary');
				await this.downloadUrl(file.url, destPath);
			} catch (e) { // TODO: 何度か再試行
				if (e instanceof Error || typeof e === 'string') {
					this.logger.error(e);
				}
				throw e;
			}

			const outputPath = path + '/unknown';
			try {
				this.logger.succ(`Unzipping to ${outputPath}`);
				ZipReader.withDestinationPath(outputPath).viaBuffer(await fsp.readFile(destPath));
				const isInstagram = type === 'Instagram' || fs.existsSync(outputPath + '/instagram_live') || fs.existsSync(outputPath + '/instagram_ads_and_businesses');
				const isOutbox = type === 'Mastodon' || fs.existsSync(outputPath + '/outbox.json');
				if (isInstagram) {
					const postsJson = await fsp.readFile(outputPath + '/content/posts_1.json', 'utf-8');
					const posts = JSON.parse(postsJson);
					const igFolder = await this.driveFoldersRepository.findOneBy({ name: 'Instagram', userId: job.data.user.id, parentId: folder?.id });
					if (igFolder == null && folder) {
						await this.driveFoldersRepository.insert({ id: this.idService.gen(), name: 'Instagram', userId: job.data.user.id, parentId: folder.id });
						const createdFolder = await this.driveFoldersRepository.findOneBy({ name: 'Instagram', userId: job.data.user.id, parentId: folder.id });
						if (createdFolder) await this.uploadFiles(outputPath + '/media/posts', user, createdFolder.id);
					}
					this.queueService.createImportIGToDbJob(job.data.user, posts);
				} else if (isOutbox) {
					const actorJson = await fsp.readFile(outputPath + '/actor.json', 'utf-8');
					const actor = JSON.parse(actorJson);
					const isPleroma = actor['@context'].some((v: any) => typeof v === 'string' && v.match(/litepub(.*)/));
					if (isPleroma) {
						const outboxJson = await fsp.readFile(outputPath + '/outbox.json', 'utf-8');
						const outbox = JSON.parse(outboxJson);
						const processedToots = await this.recreateChain(['object', 'id'], ['object', 'inReplyTo'], outbox.orderedItems.filter((x: any) => x.type === 'Create' && x.object.type === 'Note'), true);
						this.queueService.createImportPleroToDbJob(job.data.user, processedToots, null);
					} else {
						const outboxJson = await fsp.readFile(outputPath + '/outbox.json', 'utf-8');
						const outbox = JSON.parse(outboxJson);
						let mastoFolder = await this.driveFoldersRepository.findOneBy({ name: 'Mastodon', userId: job.data.user.id, parentId: folder?.id });
						if (mastoFolder == null && folder) {
							await this.driveFoldersRepository.insert({ id: this.idService.gen(), name: 'Mastodon', userId: job.data.user.id, parentId: folder.id });
							mastoFolder = await this.driveFoldersRepository.findOneBy({ name: 'Mastodon', userId: job.data.user.id, parentId: folder.id });
						}
						if (fs.existsSync(outputPath + '/media_attachments/files') && mastoFolder) {
							await this.uploadFiles(outputPath + '/media_attachments/files', user, mastoFolder.id);
						}
						const processedToots = await this.recreateChain(['object', 'id'], ['object', 'inReplyTo'], outbox.orderedItems.filter((x: any) => x.type === 'Create' && x.object.type === 'Note'), true);
						this.queueService.createImportMastoToDbJob(job.data.user, processedToots, null);
					}
				}
			} finally {
				cleanup();
			}
		} else if (job.data.type === 'Misskey' || file.name.startsWith('notes-') && file.name.endsWith('.json')) {
			const [path, cleanup] = await createTemp();

			this.logger.info(`Temp dir is ${path}`);

			try {
				await fsp.writeFile(path, '', 'utf-8');
				await this.downloadUrl(file.url, path);
			} catch (e) { // TODO: 何度か再試行
				if (e instanceof Error || typeof e === 'string') {
					this.logger.error(e);
				}
				throw e;
			}

			const notesJson = await fsp.readFile(path, 'utf-8');
			const notes = JSON.parse(notesJson);
			const processedNotes = await this.recreateChain(['id'], ['replyId'], notes, false);
			this.queueService.createImportKeyNotesToDbJob(job.data.user, processedNotes, null);
			cleanup();
		}

		this.logger.succ('Import jobs created');
	}

	@bindThis
	public async processKeyNotesToDb(job: Bull.Job<DbNoteWithParentImportToDbJobData>): Promise<void> {
		const note = job.data.target;
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		if (note.renoteId) return;

		const parentNote = job.data.note ? await this.notesRepository.findOneBy({ id: job.data.note }) : null;

		const folder = await this.driveFoldersRepository.findOneBy({ name: 'Imports', userId: job.data.user.id });
		if (folder == null) return;

		const files: MiDriveFile[] = [];
		const date = new Date(note.createdAt);

		if (note.files && this.isIterable(note.files)) {
			let keyFolder = await this.driveFoldersRepository.findOneBy({ name: 'Misskey', userId: job.data.user.id, parentId: folder.id });
			if (keyFolder == null) {
				await this.driveFoldersRepository.insert({ id: this.idService.gen(), name: 'Misskey', userId: job.data.user.id, parentId: folder.id });
				keyFolder = await this.driveFoldersRepository.findOneBy({ name: 'Misskey', userId: job.data.user.id, parentId: folder.id });
			}

			for await (const file of note.files) {
				const [filePath, cleanup] = await createTemp();
				const slashdex = file.url.lastIndexOf('/');
				const name = file.url.substring(slashdex + 1);

				const exists = await this.driveFilesRepository.findOneBy({ name: name, userId: user.id }) ?? await this.driveFilesRepository.findOneBy({ name: name, userId: user.id, folderId: keyFolder?.id });

				if (!exists) {
					try {
						await this.downloadUrl(file.url, filePath);
					} catch (e) { // TODO: 何度か再試行
						this.logger.error(e instanceof Error ? e : new Error(e as string));
					}
					const driveFile = await this.driveService.addFile({
						user: user,
						path: filePath,
						name: name,
						folderId: keyFolder?.id,
					});
					files.push(driveFile);
				} else {
					files.push(exists);
				}

				cleanup();
			}
		}

		const createdNote = await this.noteCreateService.import(user, { createdAt: date, reply: parentNote, text: note.text, apMentions: new Array(0), visibility: note.visibility, localOnly: note.localOnly, files: files, cw: note.cw });
		if (note.childNotes) this.queueService.createImportKeyNotesToDbJob(user, note.childNotes, createdNote.id);
	}

	@bindThis
	public async processMastoToDb(job: Bull.Job<DbNoteWithParentImportToDbJobData>): Promise<void> {
		const toot = job.data.target;
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		const followers = toot.to.some((str: string) => str.includes('/followers'));

		if (toot.directMessage || !toot.to.includes('https://www.w3.org/ns/activitystreams#Public') && !followers) return;

		const visibility = followers ? toot.cc.includes('https://www.w3.org/ns/activitystreams#Public') ? 'home' : 'followers' : 'public';

		const date = new Date(toot.object.published);
		let text = undefined;
		const files: MiDriveFile[] = [];
		let reply: MiNote | null = null;

		if (toot.object.inReplyTo != null) {
			const parentNote = job.data.note ? await this.notesRepository.findOneBy({ id: job.data.note }) : null;
			if (parentNote) {
				reply = parentNote;
			} else {
				try {
					reply = await this.apNoteService.resolveNote(toot.object.inReplyTo);
				} catch (error) {
					reply = null;
				}
			}
		}

		const hashtags = extractApHashtagObjects(toot.object.tag).map((x) => x.name).filter((x): x is string => x != null);

		try {
			text = await this.mfmService.fromHtml(toot.object.content, hashtags);
		} catch (error) {
			text = undefined;
		}

		if (toot.object.attachment && this.isIterable(toot.object.attachment)) {
			for await (const file of toot.object.attachment) {
				const slashdex = file.url.lastIndexOf('/');
				const name = file.url.substring(slashdex + 1);
				const exists = await this.driveFilesRepository.findOneBy({ name: name, userId: user.id });
				if (exists) {
					if (file.name) {
						this.driveService.updateFile(exists, { comment: file.name }, user);
					}

					files.push(exists);
				}
			}
		}

		const createdNote = await this.noteCreateService.import(user, { createdAt: date, text: text, files: files, visibility: visibility, apMentions: new Array(0), cw: toot.object.sensitive ? toot.object.summary : null, reply: reply });
		if (toot.childNotes) this.queueService.createImportMastoToDbJob(user, toot.childNotes, createdNote.id);
	}

	@bindThis
	public async processPleroToDb(job: Bull.Job<DbNoteWithParentImportToDbJobData>): Promise<void> {
		const post = job.data.target;
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		if (post.directMessage) return;

		const date = new Date(post.object.published);
		let text = undefined;
		const files: MiDriveFile[] = [];
		let reply: MiNote | null = null;

		const folder = await this.driveFoldersRepository.findOneBy({ name: 'Imports', userId: job.data.user.id });
		if (folder == null) return;

		if (post.object.inReplyTo != null) {
			const parentNote = job.data.note ? await this.notesRepository.findOneBy({ id: job.data.note }) : null;
			if (parentNote) {
				reply = parentNote;
			} else {
				try {
					reply = await this.apNoteService.resolveNote(post.object.inReplyTo);
				} catch (error) {
					reply = null;
				}
			}
		}

		const hashtags = extractApHashtagObjects(post.object.tag).map((x) => x.name).filter((x): x is string => x != null);

		try {
			text = await this.mfmService.fromHtml(post.object.content, hashtags);
		} catch (error) {
			text = undefined;
		}

		if (post.object.attachment && this.isIterable(post.object.attachment)) {
			let pleroFolder = await this.driveFoldersRepository.findOneBy({ name: 'Pleroma', userId: job.data.user.id, parentId: folder.id });
			if (pleroFolder == null) {
				await this.driveFoldersRepository.insert({ id: this.idService.gen(), name: 'Pleroma', userId: job.data.user.id, parentId: folder.id });
				pleroFolder = await this.driveFoldersRepository.findOneBy({ name: 'Pleroma', userId: job.data.user.id, parentId: folder.id });
			}

			for await (const file of post.object.attachment) {
				const slashdex = file.url.lastIndexOf('/');
				const filename = file.url.substring(slashdex + 1);
				const hash = crypto.createHash('md5').update(file.url).digest('base64url');
				const name = `${hash}-${filename}`;
				const [filePath, cleanup] = await createTemp();

				const exists = await this.driveFilesRepository.findOneBy({ name: name, userId: user.id }) ?? await this.driveFilesRepository.findOneBy({ name: name, userId: user.id, folderId: pleroFolder?.id });

				if (!exists) {
					try {
						await this.downloadUrl(file.url, filePath);
					} catch (e) { // TODO: 何度か再試行
						this.logger.error(e instanceof Error ? e : new Error(e as string));
					}
					const driveFile = await this.driveService.addFile({
						user: user,
						path: filePath,
						name: name,
						comment: file.name,
						folderId: pleroFolder?.id,
					});
					files.push(driveFile);
				} else {
					files.push(exists);
				}

				cleanup();
			}
		}

		const createdNote = await this.noteCreateService.import(user, { createdAt: date, text: text, files: files, apMentions: new Array(0), cw: post.object.sensitive ? post.object.summary : null, reply: reply });
		if (post.childNotes) this.queueService.createImportPleroToDbJob(user, post.childNotes, createdNote.id);
	}

	@bindThis
	public async processIGDb(job: Bull.Job<DbNoteImportToDbJobData>): Promise<void> {
		const post = job.data.target;
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		let date;
		let title;
		const files: MiDriveFile[] = [];

		function decodeIGString(str: string) {
			const arr = [];
			for (let i = 0; i < str.length; i++) {
				arr.push(str.charCodeAt(i));
			}
			return Buffer.from(arr).toString('utf8');
		}

		if (post.media && this.isIterable(post.media) && post.media.length > 1) {
			date = new Date(post.creation_timestamp * 1000);
			title = decodeIGString(post.title);
			for await (const file of post.media) {
				const slashdex = file.uri.lastIndexOf('/');
				const name = file.uri.substring(slashdex + 1);
				const exists = await this.driveFilesRepository.findOneBy({ name: name, userId: user.id }) ?? await this.driveFilesRepository.findOneBy({ name: `${name}.jpg`, userId: user.id }) ?? await this.driveFilesRepository.findOneBy({ name: `${name}.mp4`, userId: user.id });
				if (exists) {
					files.push(exists);
				}
			}
		} else if (post.media && this.isIterable(post.media) && !(post.media.length > 1)) {
			date = new Date(post.media[0].creation_timestamp * 1000);
			title = decodeIGString(post.media[0].title);
			const slashdex = post.media[0].uri.lastIndexOf('/');
			const name = post.media[0].uri.substring(slashdex + 1);
			const exists = await this.driveFilesRepository.findOneBy({ name: name, userId: user.id }) ?? await this.driveFilesRepository.findOneBy({ name: `${name}.jpg`, userId: user.id }) ?? await this.driveFilesRepository.findOneBy({ name: `${name}.mp4`, userId: user.id });
			if (exists) {
				files.push(exists);
			}
		}

		await this.noteCreateService.import(user, { createdAt: date, text: title, files: files });
	}

	@bindThis
	public async processTwitterDb(job: Bull.Job<DbNoteWithParentImportToDbJobData>): Promise<void> {
		const tweet = job.data.target;
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		const folder = await this.driveFoldersRepository.findOneBy({ name: 'Imports', userId: job.data.user.id });
		if (folder == null) return;

		const parentNote = job.data.note ? await this.notesRepository.findOneBy({ id: job.data.note }) : null;

		async function replaceTwitterUrls(full_text: string, urls: any) {
			let full_textedit = full_text;
			urls.forEach((url: any) => {
				full_textedit = full_textedit.replaceAll(url.url, url.expanded_url);
			});
			return full_textedit;
		}

		async function replaceTwitterMentions(full_text: string, mentions: any) {
			let full_textedit = full_text;
			mentions.forEach((mention: any) => {
				full_textedit = full_textedit.replaceAll(`@${mention.screen_name}`, `[@${mention.screen_name}](https://twitter.com/${mention.screen_name})`);
			});
			return full_textedit;
		}

		try {
			const date = new Date(tweet.created_at);
			const decodedText = tweet.full_text.replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&');
			const textReplaceURLs = tweet.entities.urls && tweet.entities.urls.length > 0 ? await replaceTwitterUrls(decodedText, tweet.entities.urls) : decodedText;
			const text = tweet.entities.user_mentions && tweet.entities.user_mentions.length > 0 ? await replaceTwitterMentions(textReplaceURLs, tweet.entities.user_mentions) : textReplaceURLs;
			const files: MiDriveFile[] = [];

			if (tweet.extended_entities && this.isIterable(tweet.extended_entities.media)) {
				let twitFolder = await this.driveFoldersRepository.findOneBy({ name: 'Twitter', userId: job.data.user.id, parentId: folder.id });
				if (twitFolder == null) {
					await this.driveFoldersRepository.insert({ id: this.idService.gen(), name: 'Twitter', userId: job.data.user.id, parentId: folder.id });
					twitFolder = await this.driveFoldersRepository.findOneBy({ name: 'Twitter', userId: job.data.user.id, parentId: folder.id });
				}

				for await (const file of tweet.extended_entities.media) {
					if (file.video_info) {
						const [filePath, cleanup] = await createTemp();
						const slashdex = file.video_info.variants[0].url.lastIndexOf('/');
						const name = file.video_info.variants[0].url.substring(slashdex + 1);

						const exists = await this.driveFilesRepository.findOneBy({ name: name, userId: user.id }) ?? await this.driveFilesRepository.findOneBy({ name: name, userId: user.id, folderId: twitFolder?.id });

						const videos = file.video_info.variants.filter((x: any) => x.content_type === 'video/mp4');

						if (!exists) {
							try {
								await this.downloadService.downloadUrl(videos[0].url, filePath);
							} catch (e) { // TODO: 何度か再試行
								this.logger.error(e instanceof Error ? e : new Error(e as string));
							}
							const driveFile = await this.driveService.addFile({
								user: user,
								path: filePath,
								name: name,
								folderId: twitFolder?.id,
							});
							files.push(driveFile);
						} else {
							files.push(exists);
						}

						cleanup();
					} else if (file.media_url_https) {
						const [filePath, cleanup] = await createTemp();
						const slashdex = file.media_url_https.lastIndexOf('/');
						const name = file.media_url_https.substring(slashdex + 1);

						const exists = await this.driveFilesRepository.findOneBy({ name: name, userId: user.id });

						if (!exists) {
							try {
								await this.downloadService.downloadUrl(file.media_url_https, filePath);
							} catch (e) { // TODO: 何度か再試行
								this.logger.error(e instanceof Error ? e : new Error(e as string));
							}

							const driveFile = await this.driveService.addFile({
								user: user,
								path: filePath,
								name: name,
								folderId: twitFolder?.id,
							});
							files.push(driveFile);
						} else {
							files.push(exists);
						}
						cleanup();
					}
				}
			}
			const createdNote = await this.noteCreateService.import(user, { createdAt: date, reply: parentNote, text: text, files: files });
			if (tweet.childNotes) this.queueService.createImportTweetsToDbJob(user, tweet.childNotes, createdNote.id);
		} catch (e) {
			this.logger.warn(`Error: ${e}`);
		}
	}

	@bindThis
	public async processFBDb(job: Bull.Job<DbNoteImportToDbJobData>): Promise<void> {
		const post = job.data.target;
		const user = await this.usersRepository.findOneBy({ id: job.data.user.id });
		if (user == null) {
			return;
		}

		if (!this.isIterable(post.data) || this.isIterable(post.data) && post.data[0].post === undefined) return;

		const date = new Date(post.timestamp * 1000);
		const title = decodeFBString(post.data[0].post);
		const files: MiDriveFile[] = [];

		function decodeFBString(str: string) {
			const arr = [];
			for (let i = 0; i < str.length; i++) {
				arr.push(str.charCodeAt(i));
			}
			return Buffer.from(arr).toString('utf8');
		}

		if (post.attachments && this.isIterable(post.attachments)) {
			const media = [];
			for await (const data of post.attachments[0].data) {
				if (data.media) {
					media.push(data.media);
				}
			}

			for await (const file of media) {
				const slashdex = file.uri.lastIndexOf('/');
				const name = file.uri.substring(slashdex + 1);
				const exists = await this.driveFilesRepository.findOneBy({ name: name, userId: user.id });
				if (exists) {
					files.push(exists);
				}
			}
		}

		await this.noteCreateService.import(user, { createdAt: date, text: title, files: files });
	}
}
