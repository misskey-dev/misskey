process.env.NODE_ENV = 'production';

import monk from 'monk';
import * as mongo from 'mongodb';
import * as fs from 'fs';
import * as uuid from 'uuid';
import chalk from 'chalk';
import config from './config';
import { initDb } from './db/postgre';
import { User } from './models/entities/user';
import { getRepository } from 'typeorm';
import generateUserToken from './server/api/common/generate-native-user-token';
import { DriveFile } from './models/entities/drive-file';
import { DriveFolder } from './models/entities/drive-folder';
import { InternalStorage } from './services/drive/internal-storage';
import { createTemp } from './misc/create-temp';
import { Note } from './models/entities/note';
import { Following } from './models/entities/following';
import { genId } from './misc/gen-id';
import { Poll } from './models/entities/poll';
import { PollVote } from './models/entities/poll-vote';
import { NoteFavorite } from './models/entities/note-favorite';

const u = (config as any).mongodb.user ? encodeURIComponent((config as any).mongodb.user) : null;
const p = (config as any).mongodb.pass ? encodeURIComponent((config as any).mongodb.pass) : null;

const uri = `mongodb://${u && p ? `${u}:${p}@` : ''}${(config as any).mongodb.host}:${(config as any).mongodb.port}/${(config as any).mongodb.db}`;

const db = monk(uri);
let mdb: mongo.Db;

const nativeDbConn = async (): Promise<mongo.Db> => {
	if (mdb) return mdb;

	const db = await ((): Promise<mongo.Db> => new Promise((resolve, reject) => {
		mongo.MongoClient.connect(uri, { useNewUrlParser: true }, (e: Error, client: any) => {
			if (e) return reject(e);
			resolve(client.db((config as any).mongodb.db));
		});
	}))();

	mdb = db;

	return db;
};

const _User = db.get<any>('users');
const _DriveFile = db.get<any>('driveFiles.files');
const _DriveFolder = db.get<any>('driveFolders');
const _Note = db.get<any>('notes');
const _Following = db.get<any>('following');
const _PollVote = db.get<any>('pollVotes');
const _Favorite = db.get<any>('favorites');
const getDriveFileBucket = async (): Promise<mongo.GridFSBucket> => {
	const db = await nativeDbConn();
	const bucket = new mongo.GridFSBucket(db, {
		bucketName: 'driveFiles'
	});
	return bucket;
};

async function main() {
	await initDb();
	const Users = getRepository(User);
	const DriveFiles = getRepository(DriveFile);
	const DriveFolders = getRepository(DriveFolder);
	const Notes = getRepository(Note);
	const Followings = getRepository(Following);
	const Polls = getRepository(Poll);
	const PollVotes = getRepository(PollVote);
	const NoteFavorites = getRepository(NoteFavorite);

	async function migrateUser(user: any) {
		await Users.insert({
			id: user._id.toHexString(),
			createdAt: user.createdAt || new Date(),
			username: user.username,
			usernameLower: user.username.toLowerCase(),
			host: user.host,
			token: generateUserToken(),
			password: user.password,
			isAdmin: user.isAdmin,
			autoAcceptFollowed: true,
			autoWatch: false,
			name: user.name,
			location: user.profile ? user.profile.location : null,
			birthday: user.profile ? user.profile.birthday : null,
			followersCount: user.followersCount,
			followingCount: user.followingCount,
			notesCount: user.notesCount,
			description: user.description,
			isBot: user.isBot,
			isCat: user.isCat,
			isVerified: user.isVerified,
			inbox: user.inbox,
			sharedInbox: user.sharedInbox,
			uri: user.uri,
		});
	}

	async function migrateFollowing(following: any) {
		await Followings.save({
			id: following._id.toHexString(),
			createdAt: following.createdAt || new Date(),
			followerId: following.followerId.toHexString(),
			followeeId: following.followeeId.toHexString(),

			// 非正規化
			followerHost: following._follower ? following._follower.host : null,
			followerInbox: following._follower ? following._follower.inbox : null,
			followerSharedInbox: following._follower ? following._follower.sharedInbox : null,
			followeeHost: following._followee ? following._followee.host : null,
			followeeInbox: following._followee ? following._followee.inbox : null,
			followeeSharedInbox: following._followee ? following._followee.sharedInbo : null
		});
	}

	async function migrateDriveFolder(folder: any) {
		await DriveFolders.save({
			id: folder._id.toHexString(),
			createdAt: folder.createdAt || new Date(),
			name: folder.name,
			parentId: folder.parentId ? folder.parentId.toHexString() : null,
		});
	}

	async function migrateDriveFile(file: any) {
		const user = await _User.findOne({
			_id: file.metadata.userId
		});
		if (file.metadata.storage && file.metadata.storage.key) { // when object storage
			await DriveFiles.save({
				id: file._id.toHexString(),
				userId: user._id.toHexString(),
				userHost: user.host,
				createdAt: file.uploadDate || new Date(),
				md5: file.md5,
				name: file.filename,
				type: file.contentType,
				properties: file.metadata.properties,
				size: file.length,
				url: file.metadata.url,
				uri: file.metadata.uri,
				accessKey: file.metadata.storage.key,
				folderId: file.metadata.folderId ? file.metadata.folderId.toHexString() : null,
				storedInternal: false,
				isRemote: false
			});
		} else if (!file.metadata.isRemote) {
			const [temp, clean] = await createTemp();
			await new Promise(async (res, rej) => {
				const bucket = await getDriveFileBucket();
				const readable = bucket.openDownloadStream(file._id);
				const dest = fs.createWriteStream(temp);
				readable.pipe(dest);
				readable.on('end', () => {
					dest.end();
					res();
				});
			});

			const key = uuid.v4();
			const url = InternalStorage.saveFromPath(key, temp);
			await DriveFiles.save({
				id: file._id.toHexString(),
				userId: user._id.toHexString(),
				userHost: user.host,
				createdAt: file.uploadDate || new Date(),
				md5: file.md5,
				name: file.filename,
				type: file.contentType,
				properties: file.metadata.properties,
				size: file.length,
				url: url,
				uri: file.metadata.uri,
				accessKey: key,
				folderId: file.metadata.folderId,
				storedInternal: true,
				isRemote: false
			});
			clean();
		} else {
			await DriveFiles.save({
				id: file._id.toHexString(),
				userId: user._id.toHexString(),
				userHost: user.host,
				createdAt: file.uploadDate || new Date(),
				md5: file.md5,
				name: file.filename,
				type: file.contentType,
				properties: file.metadata.properties,
				size: file.length,
				url: file.metadata.url,
				uri: file.metadata.uri,
				accessKey: null,
				folderId: file.metadata.folderId,
				storedInternal: false,
				isRemote: true
			});
		}
	}

	async function migrateNote(note: any) {
		await Notes.insert({
			id: note._id.toHexString(),
			createdAt: note.createdAt || new Date(),
			text: note.text,
			cw: note.cw || null,
			tags: note.tags || [],
			userId: note.userId.toHexString(),
			viaMobile: note.viaMobile || false,
			geo: note.geo,
			appId: null,
			visibility: note.visibility || 'public',
			visibleUserIds: note.visibleUserIds ? note.visibleUserIds.map((id: any) => id.toHexString()) : [],
			replyId: note.replyId ? note.replyId.toHexString() : null,
			renoteId: note.renoteId ? note.renoteId.toHexString() : null,
			userHost: null,
			fileIds: note.fileIds ? note.fileIds.map((id: any) => id.toHexString()) : [],
			localOnly: note.localOnly || false,
			hasPoll: note.poll != null
		});

		if (note.poll) {
			await Polls.save({
				id: genId(),
				noteId: note._id.toHexString(),
				choices: note.poll.choices.map((x: any) => x.text),
				expiresAt: note.poll.expiresAt,
				multiple: note.poll.multiple,
				votes: note.poll.choices.map((x: any) => x.votes),
				noteVisibility: note.visibility,
				userId: note.userId.toHexString(),
				userHost: null
			});
		}
	}

	async function migratePollVote(vote: any) {
		await PollVotes.save({
			id: vote._id.toHexString(),
			createdAt: vote.createdAt,
			noteId: vote.noteId.toHexString(),
			userId: vote.userId.toHexString(),
			choice: vote.choice
		});
	}

	async function migrateNoteFavorite(favorite: any) {
		await NoteFavorites.save({
			id: favorite._id.toHexString(),
			createdAt: favorite.createdAt,
			noteId: favorite.noteId.toHexString(),
			userId: favorite.userId.toHexString(),
		});
	}

	const allUsersCount = await _User.count();
	for (let i = 0; i < allUsersCount; i++) {
		const user = await _User.findOne({}, {
			skip: i
		});
		try {
			await migrateUser(user);
			console.log(`USER (${i + 1}/${allUsersCount}) ${user._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`USER (${i + 1}/${allUsersCount}) ${user._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	const allFollowingsCount = await _Following.count();
	for (let i = 0; i < allFollowingsCount; i++) {
		const following = await _Following.findOne({}, {
			skip: i
		});
		try {
			await migrateFollowing(following);
			console.log(`FOLLOWING (${i + 1}/${allFollowingsCount}) ${following._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`FOLLOWING (${i + 1}/${allFollowingsCount}) ${following._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	const allDriveFoldersCount = await _DriveFolder.count();
	for (let i = 0; i < allDriveFoldersCount; i++) {
		const folder = await _DriveFolder.findOne({}, {
			skip: i
		});
		try {
			await migrateDriveFolder(folder);
			console.log(`DRIVEFOLDER (${i + 1}/${allDriveFoldersCount}) ${folder._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`DRIVEFOLDER (${i + 1}/${allDriveFoldersCount}) ${folder._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	const allDriveFilesCount = await _DriveFile.count();
	for (let i = 0; i < allDriveFilesCount; i++) {
		const file = await _DriveFile.findOne({}, {
			skip: i
		});
		try {
			await migrateDriveFile(file);
			console.log(`DRIVEFILE (${i + 1}/${allDriveFilesCount}) ${file._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`DRIVEFILE (${i + 1}/${allDriveFilesCount}) ${file._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	const allNotesCount = await _Note.count({
		'_user.host': null
	});
	for (let i = 0; i < allNotesCount; i++) {
		const note = await _Note.findOne({
			'_user.host': null
		}, {
			skip: i
		});
		try {
			await migrateNote(note);
			console.log(`NOTE (${i + 1}/${allNotesCount}) ${note._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`NOTE (${i + 1}/${allNotesCount}) ${note._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	const allPollVotesCount = await _PollVote.count();
	for (let i = 0; i < allPollVotesCount; i++) {
		const vote = await _PollVote.findOne({}, {
			skip: i
		});
		try {
			await migratePollVote(vote);
			console.log(`POLLVOTE (${i + 1}/${allPollVotesCount}) ${vote._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`POLLVOTE (${i + 1}/${allPollVotesCount}) ${vote._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	const allNoteFavoritesCount = await _Favorite.count();
	for (let i = 0; i < allNoteFavoritesCount; i++) {
		const favorite = await _Favorite.findOne({}, {
			skip: i
		});
		try {
			await migrateNoteFavorite(favorite);
			console.log(`FAVORITE (${i + 1}/${allNoteFavoritesCount}) ${favorite._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`FAVORITE (${i + 1}/${allNoteFavoritesCount}) ${favorite._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}
}

main();
