import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import { pack as packFolder } from './drive-folder';
import { pack as packUser } from './user';
import monkDb, { nativeDbConn, dbLogger } from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import config from '../config';
import uuid = require('uuid');

const DriveFile = monkDb.get<IDriveFile>('driveFiles.files');
DriveFile.createIndex('md5');
DriveFile.createIndex('metadata.uri');
DriveFile.createIndex('metadata.url');
DriveFile.createIndex('metadata.webpublicUrl');
DriveFile.createIndex('metadata.thumbnailUrl');
DriveFile.createIndex('metadata.userId');
DriveFile.createIndex('metadata.folderId');
DriveFile.createIndex('metadata._user.host');
export default DriveFile;

// 後方互換性のため
DriveFile.findOne({
	$or: [{
		'metadata.url': { $exists: false }
	}, {
		'metadata.url': null
	}]
}).then(x => {
	if (x != null) {
		DriveFile.find({
			$or: [{
				'metadata.url': { $exists: false }
			}, {
				'metadata.url': null
			}]
		}, { fields: { _id: true, filename: true, contentType: true } }).then(xs => {
			for (const x of xs) {
				let [ext] = (x.filename.match(/\.([a-zA-Z0-9_-]+)$/) || ['']);

				if (ext === '') {
					if (x.contentType === 'image/jpeg') ext = '.jpg';
					if (x.contentType === 'image/png') ext = '.png';
					if (x.contentType === 'image/webp') ext = '.webp';
				}

				DriveFile.update({ _id: x._id }, {
					$set: {
						'metadata.url': `${config.driveUrl}/${uuid.v4()}${ext}`,
						'metadata.webpublicUrl': `${config.driveUrl}/${uuid.v4()}${ext}`,
						'metadata.thumbnailUrl': `${config.driveUrl}/${uuid.v4()}.jpg`,
					}
				});
			}
		});
	}
});

export const DriveFileChunk = monkDb.get('driveFiles.chunks');

export const getDriveFileBucket = async (): Promise<mongo.GridFSBucket> => {
	const db = await nativeDbConn();
	const bucket = new mongo.GridFSBucket(db, {
		bucketName: 'driveFiles'
	});
	return bucket;
};

export type IMetadata = {
	properties: any;
	userId: mongo.ObjectID;
	_user: any;
	folderId: mongo.ObjectID;
	comment: string;

	/**
	 * リモートインスタンスから取得した場合の元URL
	 */
	uri?: string;

	url: string;
	thumbnailUrl?: string;
	webpublicUrl?: string;

	src?: string;
	deletedAt?: Date;

	/**
	 * このファイルの中身データがMongoDB内に保存されていないか否か
	 * オブジェクトストレージを利用している or リモートサーバーへの直リンクである
	 * な場合は true になります
	 */
	withoutChunks?: boolean;

	storage?: string;

	/***
	 * ObjectStorage の格納先の情報
	 */
	storageProps?: IStorageProps;
	isSensitive?: boolean;

	/**
	 * このファイルが添付された投稿のID一覧
	 */
	attachedNoteIds?: mongo.ObjectID[];

	/**
	 * 外部の(信頼されていない)URLへの直リンクか否か
	 */
	isRemote?: boolean;
};

export type IStorageProps = {
	/**
	 * ObjectStorage key for original
	 */
	key: string;

	/***
	 * ObjectStorage key for thumbnail (thumbnailがなければなし)
	 */
	thumbnailKey?: string;

	/***
	 * ObjectStorage key for webpublic (webpublicがなければなし)
	 */
	webpublicKey?: string;

	id?: string;
};

export type IDriveFile = {
	_id: mongo.ObjectID;
	uploadDate: Date;
	md5: string;
	filename: string;
	contentType: string;
	metadata: IMetadata;

	/**
	 * ファイルサイズ
	 */
	length: number;
};

export function validateFileName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200) &&
		(name.indexOf('\\') === -1) &&
		(name.indexOf('/') === -1) &&
		(name.indexOf('..') === -1)
	);
}

export const packMany = (
	files: any[],
	options?: {
		detail?: boolean
		self?: boolean,
		withUser?: boolean,
	}
) => {
	return Promise.all(files.map(f => pack(f, options)));
};

/**
 * Pack a drive file for API response
 */
export const pack = (
	file: any,
	options?: {
		detail?: boolean,
		self?: boolean,
		withUser?: boolean,
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false,
		self: false
	}, options);

	let _file: any;

	// Populate the file if 'file' is ID
	if (isObjectId(file)) {
		_file = await DriveFile.findOne({
			_id: file
		});
	} else if (typeof file === 'string') {
		_file = await DriveFile.findOne({
			_id: new mongo.ObjectID(file)
		});
	} else {
		_file = deepcopy(file);
	}

	// (データベースの欠損などで)ファイルがデータベース上に見つからなかったとき
	if (_file == null) {
		dbLogger.warn(`[DAMAGED DB] (missing) pkg: driveFile :: ${file}`);
		return resolve(null);
	}

	// rendered target
	let _target: any = {};

	_target.id = _file._id;
	_target.createdAt = _file.uploadDate;
	_target.name = _file.filename;
	_target.type = _file.contentType;
	_target.datasize = _file.length;
	_target.md5 = _file.md5;

	_target = Object.assign(_target, _file.metadata);

	const isImage = file.contentType && file.contentType.startsWith('image/');

	_target.url = _file.metadata.webpublicUrl || _file.metadata.url;
	_target.thumbnailUrl = _file.metadata.thumbnailUrl || _file.metadata.webpublicUrl || (isImage ? _file.metadata.url : '/assets/thumbnail-not-available.png');
	_target.isRemote = _file.metadata.isRemote;

	if (_target.properties == null) _target.properties = {};

	if (opts.detail) {
		if (_target.folderId) {
			// Populate folder
			_target.folder = await packFolder(_target.folderId, {
				detail: true
			});
		}

		/*
		if (_target.tags) {
			// Populate tags
			_target.tags = await _target.tags.map(async (tag: any) =>
				await serializeDriveTag(tag)
			);
		}
		*/
	}

	if (opts.withUser) {
		// Populate user
		_target.user = await packUser(_file.metadata.userId);
	}

	delete _target.withoutChunks;
	delete _target.storage;
	delete _target.storageProps;
	delete _target.isRemote;
	delete _target._user;

	if (opts.self) {
		_target.url = _file.metadata.url;
	}

	resolve(_target);
});
