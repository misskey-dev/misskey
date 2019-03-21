import { PrimaryGeneratedColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import * as deepcopy from 'deepcopy';
import { pack as packFolder, DriveFolder } from './drive-folder';
import { pack as packUser, User } from './user';
import getDriveFileUrl, { getOriginalUrl } from '../misc/get-drive-file-url';

@Entity()
export class DriveFile {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column({
		type: 'date',
		comment: 'The created date of the DriveFile.'
	})
	public createdAt: Date;

	@Index()
	@Column({
		type: 'varchar', length: 24, nullable: true,
		comment: 'The owner ID.'
	})
	public userId: string | null;

	@ManyToOne(type => User, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column({
		type: 'varchar', length: 32,
		comment: 'The MD5 hash of the DriveFile.'
	})
	public md5: string;

	@Column({
		type: 'varchar', length: 256,
		comment: 'The file name of the DriveFile.'
	})
	public name: string;

	@Column({
		type: 'varchar', length: 128,
		comment: 'The contentType (MIME) of the DriveFile.'
	})
	public contentType: string;

	@Column({
		type: 'integer',
		comment: 'The file size (bytes) of the DriveFile.'
	})
	public size: number;

	@Column({
		type: 'varchar', length: 512, nullable: true,
		comment: 'The comment of the DriveFile.'
	})
	public comment: string | null;

	@Column({
		type: 'jsonb', default: {},
		comment: 'The any properties of the DriveFile. For example, it includes image width/height.'
	})
	public properties: Record<string, any>;

	@Column({
		type: 'jsonb', default: {},
		comment: 'The storage information of the DriveFile.'
	})
	public storage: Record<string, any>;

	@Index()
	@Column({
		type: 'varchar', length: 512, nullable: true,
		comment: 'The URI of the DriveFile. it will be null when the DriveFile is local.'
	})
	public uri: string | null;

	@Index()
	@Column({
		type: 'integer', nullable: true,
		comment: 'The parent folder ID. If null, it means the DriveFile is located in root.'
	})
	public folderId: number | null;

	@ManyToOne(type => DriveFolder, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public folder: DriveFolder | null;

	@Column({
		type: 'boolean', default: false,
		comment: 'Whether the DriveFile is NSFW.'
	})
	public isSensitive: boolean;

	/**
	 * 外部の(信頼されていない)URLへの直リンクか否か
	 */
	@Column({
		type: 'boolean', default: false,
		comment: 'Whether the DriveFile is direct link to remote server.'
	})
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
