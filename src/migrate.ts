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
import { Poll } from './models/entities/poll';
import { PollVote } from './models/entities/poll-vote';
import { NoteFavorite } from './models/entities/note-favorite';
import { NoteReaction } from './models/entities/note-reaction';
import { UserPublickey } from './models/entities/user-publickey';
import { UserKeypair } from './models/entities/user-keypair';
import { extractPublic } from './crypto_key';
import { Emoji } from './models/entities/emoji';
import { toPuny as _toPuny } from './misc/convert-host';
import { UserProfile } from './models/entities/user-profile';
import { MessagingMessage } from './models/entities/messaging-message';
import { Muting } from './models/entities/muting';
import { Blocking } from './models/entities/blocking';

function toPuny(x: string | null): string | null {
	if (x == null) return null;
	return _toPuny(x);
}

const u = (config as any).mongodb.user ? encodeURIComponent((config as any).mongodb.user) : null;
const p = (config as any).mongodb.pass ? encodeURIComponent((config as any).mongodb.pass) : null;

const uri = `mongodb://${u && p ? `${u}:${p}@` : ''}${(config as any).mongodb.host}:${(config as any).mongodb.port}/${(config as any).mongodb.db}`;

const db = monk(uri);
let mdb: mongo.Db;

const test = false;
const limit = 500;

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
const _Blocking = db.get<any>('blocking');
const _Muting = db.get<any>('mute');
const _PollVote = db.get<any>('pollVotes');
const _Favorite = db.get<any>('favorites');
const _NoteReaction = db.get<any>('noteReactions');
const _Emoji = db.get<any>('emoji');
const _MessagingMessage = db.get<any>('messagingMessages');
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
	const UserProfiles = getRepository(UserProfile);
	const DriveFiles = getRepository(DriveFile);
	const DriveFolders = getRepository(DriveFolder);
	const Notes = getRepository(Note);
	const Followings = getRepository(Following);
	const Blockings = getRepository(Blocking);
	const Mutings = getRepository(Muting);
	const Polls = getRepository(Poll);
	const PollVotes = getRepository(PollVote);
	const NoteFavorites = getRepository(NoteFavorite);
	const NoteReactions = getRepository(NoteReaction);
	const UserPublickeys = getRepository(UserPublickey);
	const UserKeypairs = getRepository(UserKeypair);
	const Emojis = getRepository(Emoji);
	const MessagingMessages = getRepository(MessagingMessage);

	async function migrateUser(user: any) {
		await Users.save({
			id: user._id.toHexString(),
			createdAt: user.createdAt || new Date(),
			username: user.username,
			usernameLower: user.username.toLowerCase(),
			host: toPuny(user.host),
			token: generateUserToken(),
			isAdmin: user.isAdmin || false,
			name: user.name,
			followersCount: user.followersCount || 0,
			followingCount: user.followingCount || 0,
			notesCount: user.notesCount || 0,
			isBot: user.isBot || false,
			isCat: user.isCat || false,
			isVerified: user.isVerified || false,
			inbox: user.inbox,
			sharedInbox: user.sharedInbox,
			uri: user.uri,
		});
		await UserProfiles.save({
			userId: user._id.toHexString(),
			description: user.description,
			userHost: toPuny(user.host),
			autoAcceptFollowed: true,
			autoWatch: false,
			password: user.password,
			location: user.profile ? user.profile.location : null,
			birthday: user.profile ? user.profile.birthday : null,
		});
		if (user.publicKey) {
			await UserPublickeys.save({
				userId: user._id.toHexString(),
				keyId: user.publicKey.id,
				keyPem: user.publicKey.publicKeyPem
			});
		}
		if (user.keypair) {
			await UserKeypairs.save({
				userId: user._id.toHexString(),
				publicKey: extractPublic(user.keypair),
				privateKey: user.keypair,
			});
		}
	}

	async function migrateFollowing(following: any) {
		await Followings.save({
			id: following._id.toHexString(),
			createdAt: new Date(),
			followerId: following.followerId.toHexString(),
			followeeId: following.followeeId.toHexString(),

			// 非正規化
			followerHost: following._follower ? toPuny(following._follower.host) : null,
			followerInbox: following._follower ? following._follower.inbox : null,
			followerSharedInbox: following._follower ? following._follower.sharedInbox : null,
			followeeHost: following._followee ? toPuny(following._followee.host) : null,
			followeeInbox: following._followee ? following._followee.inbox : null,
			followeeSharedInbox: following._followee ? following._followee.sharedInbo : null
		});
	}

	async function migrateBlocking(blocking: any) {
		await Blockings.save({
			id: blocking._id.toHexString(),
			createdAt: new Date(),
			blockerId: blocking.blockerId.toHexString(),
			blockeeId: blocking.blockeeId.toHexString(),
		});
	}

	async function migrateMuting(muting: any) {
		await Blockings.save({
			id: muting._id.toHexString(),
			createdAt: new Date(),
			muterId: muting.muterId.toHexString(),
			muteeId: muting.muteeId.toHexString(),
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
		if (user == null) return;
		if (file.metadata.storageProps && file.metadata.storageProps.key) { // when object storage
			await DriveFiles.save({
				id: file._id.toHexString(),
				userId: user._id.toHexString(),
				userHost: toPuny(user.host),
				createdAt: file.uploadDate || new Date(),
				md5: file.md5,
				name: file.filename,
				type: file.contentType,
				properties: file.metadata.properties || {},
				size: file.length,
				url: file.metadata.url,
				uri: file.metadata.uri,
				accessKey: file.metadata.storageProps.key,
				folderId: file.metadata.folderId ? file.metadata.folderId.toHexString() : null,
				storedInternal: false,
				isLink: false
			});
		} else if (!file.metadata.isLink) {
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
				userHost: toPuny(user.host),
				createdAt: file.uploadDate || new Date(),
				md5: file.md5,
				name: file.filename,
				type: file.contentType,
				properties: file.metadata.properties,
				size: file.length,
				url: url,
				uri: file.metadata.uri,
				accessKey: key,
				folderId: file.metadata.folderId ? file.metadata.folderId.toHexString() : null,
				storedInternal: true,
				isLink: false
			});
			clean();
		} else {
			await DriveFiles.save({
				id: file._id.toHexString(),
				userId: user._id.toHexString(),
				userHost: toPuny(user.host),
				createdAt: file.uploadDate || new Date(),
				md5: file.md5,
				name: file.filename,
				type: file.contentType,
				properties: file.metadata.properties,
				size: file.length,
				url: file.metadata.url,
				uri: file.metadata.uri,
				accessKey: null,
				folderId: file.metadata.folderId ? file.metadata.folderId.toHexString() : null,
				storedInternal: false,
				isLink: true
			});
		}
	}

	async function migrateNote(note: any) {
		await Notes.save({
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

	async function migrateNoteReaction(reaction: any) {
		await NoteReactions.save({
			id: reaction._id.toHexString(),
			createdAt: reaction.createdAt,
			noteId: reaction.noteId.toHexString(),
			userId: reaction.userId.toHexString(),
			reaction: reaction.reaction
		});
	}

	async function reMigrateUser(user: any) {
		const u = await _User.findOne({
			_id: new mongo.ObjectId(user.id)
		});
		const avatar = u.avatarId ? await DriveFiles.findOne(u.avatarId.toHexString()) : null;
		const banner = u.bannerId ? await DriveFiles.findOne(u.bannerId.toHexString()) : null;
		await Users.update(user.id, {
			avatarId: avatar ? avatar.id : null,
			bannerId: banner ? banner.id : null,
			avatarUrl: avatar ? avatar.url : null,
			bannerUrl: banner ? banner.url : null
		});
	}

	async function migrateEmoji(emoji: any) {
		await Emojis.save({
			id: emoji._id.toHexString(),
			updatedAt: emoji.createdAt,
			aliases: emoji.aliases,
			url: emoji.url,
			uri: emoji.uri,
			host: toPuny(emoji.host),
			name: emoji.name
		});
	}

	async function migrateMessagingMessage(message: any) {
		await MessagingMessages.save({
			id: message._id.toHexString(),
			createdAt: message.createdAt,
			text: message.text,
			userId: message.userId.toHexString(),
			recipientId: message.recipientId.toHexString(),
			fileId: message.fileId ? message.fileId.toHexString() : null,
			isRead: message.isRead || false,
		});
	}

	let allUsersCount = await _User.count({
		deletedAt: { $exists: false }
	});
	if (test && allUsersCount > limit) allUsersCount = limit;
	for (let i = 0; i < allUsersCount; i++) {
		const user = await _User.findOne({
			deletedAt: { $exists: false }
		}, {
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

	let allFollowingsCount = await _Following.count();
	if (test && allFollowingsCount > limit) allFollowingsCount = limit;
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

	let allBlockingsCount = await _Blocking.count();
	if (test && allBlockingsCount > limit) allBlockingsCount = limit;
	for (let i = 0; i < allBlockingsCount; i++) {
		const blocking = await _Blocking.findOne({}, {
			skip: i
		});
		try {
			await migrateBlocking(blocking);
			console.log(`BLOCKING (${i + 1}/${allBlockingsCount}) ${blocking._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`BLOCKING (${i + 1}/${allBlockingsCount}) ${blocking._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	let allMutingsCount = await _Muting.count();
	if (test && allMutingsCount > limit) allMutingsCount = limit;
	for (let i = 0; i < allMutingsCount; i++) {
		const muting = await _Muting.findOne({}, {
			skip: i
		});
		try {
			await migrateMuting(muting);
			console.log(`MUTING (${i + 1}/${allMutingsCount}) ${muting._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`MUTING (${i + 1}/${allMutingsCount}) ${muting._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	let allDriveFoldersCount = await _DriveFolder.count();
	if (test && allDriveFoldersCount > limit) allDriveFoldersCount = limit;
	for (let i = 0; i < allDriveFoldersCount; i++) {
		const folder = await _DriveFolder.findOne({}, {
			skip: i
		});
		try {
			await migrateDriveFolder(folder);
			console.log(`FOLDER (${i + 1}/${allDriveFoldersCount}) ${folder._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`FOLDER (${i + 1}/${allDriveFoldersCount}) ${folder._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	let allDriveFilesCount = await _DriveFile.count({
		'metadata._user.host': null,
		'metadata.deletedAt': { $exists: false }
	});
	if (test && allDriveFilesCount > limit) allDriveFilesCount = limit;
	for (let i = 0; i < allDriveFilesCount; i++) {
		const file = await _DriveFile.findOne({
			'metadata._user.host': null,
			'metadata.deletedAt': { $exists: false }
		}, {
			skip: i
		});
		try {
			await migrateDriveFile(file);
			console.log(`FILE (${i + 1}/${allDriveFilesCount}) ${file._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`FILE (${i + 1}/${allDriveFilesCount}) ${file._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	let allNotesCount = await _Note.count({
		'_user.host': null,
		'metadata.deletedAt': { $exists: false }
	});
	if (test && allNotesCount > limit) allNotesCount = limit;
	for (let i = 0; i < allNotesCount; i++) {
		const note = await _Note.findOne({
			'_user.host': null,
			'metadata.deletedAt': { $exists: false }
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

	let allPollVotesCount = await _PollVote.count();
	if (test && allPollVotesCount > limit) allPollVotesCount = limit;
	for (let i = 0; i < allPollVotesCount; i++) {
		const vote = await _PollVote.findOne({}, {
			skip: i
		});
		try {
			await migratePollVote(vote);
			console.log(`VOTE (${i + 1}/${allPollVotesCount}) ${vote._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`VOTE (${i + 1}/${allPollVotesCount}) ${vote._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	let allNoteFavoritesCount = await _Favorite.count();
	if (test && allNoteFavoritesCount > limit) allNoteFavoritesCount = limit;
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

	let allNoteReactionsCount = await _NoteReaction.count();
	if (test && allNoteReactionsCount > limit) allNoteReactionsCount = limit;
	for (let i = 0; i < allNoteReactionsCount; i++) {
		const reaction = await _NoteReaction.findOne({}, {
			skip: i
		});
		try {
			await migrateNoteReaction(reaction);
			console.log(`REACTION (${i + 1}/${allNoteReactionsCount}) ${reaction._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`REACTION (${i + 1}/${allNoteReactionsCount}) ${reaction._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	let allActualUsersCount = await Users.count();
	if (test && allActualUsersCount > limit) allActualUsersCount = limit;
	for (let i = 0; i < allActualUsersCount; i++) {
		const [user] = await Users.find({
			take: 1,
			skip: i
		});
		try {
			await reMigrateUser(user);
			console.log(`RE:USER (${i + 1}/${allActualUsersCount}) ${user.id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`RE:USER (${i + 1}/${allActualUsersCount}) ${user.id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	const allEmojisCount = await _Emoji.count();
	for (let i = 0; i < allEmojisCount; i++) {
		const emoji = await _Emoji.findOne({}, {
			skip: i
		});
		try {
			await migrateEmoji(emoji);
			console.log(`EMOJI (${i + 1}/${allEmojisCount}) ${emoji._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`EMOJI (${i + 1}/${allEmojisCount}) ${emoji._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	const allMessagingMessagesCount = await _MessagingMessage.count();
	for (let i = 0; i < allMessagingMessagesCount; i++) {
		const message = await _MessagingMessage.findOne({}, {
			skip: i
		});
		try {
			await migrateMessagingMessage(message);
			console.log(`MESSAGE (${i + 1}/${allMessagingMessagesCount}) ${message._id} ${chalk.green('DONE')}`);
		} catch (e) {
			console.log(`MESSAGE (${i + 1}/${allMessagingMessagesCount}) ${message._id} ${chalk.red('ERR')}`);
			console.error(e);
		}
	}

	console.log('DONE :)');
}

main();
