import * as Sequelize from 'sequelize';
import { Table, Column, Model, AllowNull, Comment, Default, ForeignKey } from 'sequelize-typescript';
import * as deepcopy from 'deepcopy';
import { pack as packFolder } from './drive-folder';
import { pack as packUser } from './user';
import isObjectId from '../misc/is-objectid';
import getDriveFileUrl, { getOriginalUrl } from '../misc/get-drive-file-url';
import { dbLogger } from '../db/logger';

@Table({
	indexes: [{
		fields: ['md5', 'uri', 'createdAt', 'userId', 'folderId']
	}]
})
export class DriveFile extends Model<DriveFile> {
	@AllowNull(false)
	@Column(Sequelize.DATE)
	public createdAt: Date;

	@AllowNull(true)
	@Column(Sequelize.DATE)
	public deletedAt: Date | null;

	@Comment('The owner ID.')
	@AllowNull(false)
	@ForeignKey(() => User)
	@Column(Sequelize.INTEGER)
	public userId: number;

	@Comment('The MD5 hash of the DriveFile.')
	@AllowNull(false)
	@Column(Sequelize.STRING)
	public md5: string;

	@Comment('The file name of the DriveFile.')
	@AllowNull(false)
	@Column(Sequelize.STRING)
	public name: string;

	@Comment('The contentType (MIME) of the DriveFile.')
	@AllowNull(false)
	@Column(Sequelize.STRING)
	public contentType: string;

	@Comment('The file size (bytes) of the DriveFile.')
	@AllowNull(false)
	@Column(Sequelize.INTEGER)
	public size: number;

	@Comment('The comment of the DriveFile.')
	@AllowNull(true)
	@Column(Sequelize.STRING)
	public comment: string | null;

	@Comment('The any properties of the DriveFile. For example, it includes image width/height.')
	@AllowNull(false)
	@Default({})
	@Column(Sequelize.JSONB)
	public properties: Record<string, any>;

	@Comment('The storage information of the DriveFile.')
	@AllowNull(false)
	@Default({})
	@Column(Sequelize.JSONB)
	public storage: Record<string, any>;

	@Comment('The URI of the DriveFile. it will be null when the DriveFile is local.')
	@AllowNull(true)
	@Column(Sequelize.STRING)
	public uri: string | null;

	@Comment('The parent folder ID. If null, it means the DriveFile is located in root.')
	@AllowNull(true)
	@ForeignKey(() => DriveFolder)
	@Column(Sequelize.INTEGER)
	public folderId: number | null;

	@Comment('Whether the DriveFile is NSFW.')
	@AllowNull(false)
	@Default(false)
	@Column(Sequelize.BOOLEAN)
	public isSensitive: boolean;

	/**
	 * 外部の(信頼されていない)URLへの直リンクか否か
	 */
	@Comment('Whether the DriveFile is direct link to remote server.')
	@AllowNull(false)
	@Default(false)
	@Column(Sequelize.BOOLEAN)
	public isRemote: boolean;
}

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
