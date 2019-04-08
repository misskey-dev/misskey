import monk from 'monk';
import * as mongo from 'mongodb';
import * as fs from 'fs';
import * as uuid from 'uuid';
import config from './config';
import { initDb } from './db/postgre';
import { User } from './models/entities/user';
import { getRepository } from 'typeorm';
import generateUserToken from './server/api/common/generate-native-user-token';
import { DriveFile } from './models/entities/drive-file';
import { InternalStorage } from './services/drive/internal-storage';
import { createTemp } from './misc/create-temp';

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
			resolve(client.db((config as any).mongo.db));
		});
	}))();

	mdb = db;

	return db;
};

const _User = db.get<any>('users');
const _DriveFile = db.get<any>('driveFiles.files');
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

	const allUsersCount = await _User.count();
	for (let i = 0; i < allUsersCount; i++) {
		const user = await _User.findOne({}, {
			skip: i
		});
		await Users.save({
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
		console.log(`USER (${i + 1}/${allUsersCount}) ${user._id} DONE`);
	}

	const allDriveFilesCount = await _DriveFile.count();
	for (let i = 0; i < allDriveFilesCount; i++) {
		const file = await _DriveFile.findOne({}, {
			skip: i
		});
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
				accessKey: file.metadata.storage.key
			});
		} else {
			const [temp, clean] = await createTemp();
			const bucket = await getDriveFileBucket();
			const readable = bucket.openDownloadStream(file._id);
			fs.writeFileSync(temp, readable);
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
				accessKey: key
			});
			clean();
		}
		console.log(`DRIVEFILE (${i + 1}/${allDriveFilesCount}) ${file._id} DONE`);
	}
}

main();
