import * as mongo from 'mongodb';
import * as deepcopy from 'deepcopy';
import { pack as packFolder } from './drive-folder';
import { pack as packUser } from './user';
import monkDb, { nativeDbConn } from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import getDriveFileUrl, { getOriginalUrl } from '../misc/get-drive-file-url';
import { dbLogger } from '../db/logger';

const DriveFile = monkDb.get<IDriveFile>('driveFiles.files');
DriveFile.createIndex('md5');
DriveFile.createIndex('metadata.uri');
DriveFile.createIndex('metadata.userId');
DriveFile.createIndex('metadata.folderId');
DriveFile.createIndex('metadata._user.host');
export default DriveFile;

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

	/**
	 * URL for web(生成されている場合) or original
	 * * オブジェクトストレージを利用している or リモートサーバーへの直リンクである 場合のみ
	 */
	url?: string;

	/**
	 * URL for thumbnail (thumbnailがなければなし)
	 * * オブジェクトストレージを利用している or リモートサーバーへの直リンクである 場合のみ
	 */
	thumbnailUrl?: string;

	/**
	 * URL for original (web用が生成されてない場合はurlがoriginalを指す)
	 * * オブジェクトストレージを利用している or リモートサーバーへの直リンクである 場合のみ
	 */
	webpublicUrl?: string;

	accessKey?: string;

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

	_target.url = getDriveFileUrl(_file);
	_target.thumbnailUrl = getDriveFileUrl(_file, true);
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
		_target.url = getOriginalUrl(_file);
	}

	resolve(_target);
});
