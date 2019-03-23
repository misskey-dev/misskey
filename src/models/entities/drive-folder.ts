import * as deepcopy from 'deepcopy';
import { JoinColumn, ManyToOne, Entity, PrimaryGeneratedColumn, Index, Column } from 'typeorm';
import { User } from './user';

@Entity()
export class DriveFolder {
	@PrimaryGeneratedColumn()
	public id: number;

	@Index()
	@Column('date', {
		comment: 'The created date of the DriveFolder.'
	})
	public createdAt: Date;

	@Index()
	@Column('varchar', {
		length: 24, nullable: true,
		comment: 'The owner ID.'
	})
	public userId: User['id'] | null;

	@ManyToOne(type => User, {
		onDelete: 'CASCADE'
	})
	@JoinColumn()
	public user: User | null;

	@Index()
	@Column('integer', {
		nullable: true,
		comment: 'The parent folder ID. If null, it means the DriveFolder is located in root.'
	})
	public parentId: number | null;

	@ManyToOne(type => DriveFolder, {
		onDelete: 'SET NULL'
	})
	@JoinColumn()
	public parent: DriveFolder | null;
}

export function isValidFolderName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200)
	);
}

/**
 * Pack a drive folder for API response
 */
export const pack = (
	folder: any,
	options?: {
		detail: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false
	}, options);

	let _folder: any;

	// Populate the folder if 'folder' is ID
	if (isObjectId(folder)) {
		_folder = await DriveFolder.findOne({ _id: folder });
	} else if (typeof folder === 'string') {
		_folder = await DriveFolder.findOne({ _id: new mongo.ObjectID(folder) });
	} else {
		_folder = deepcopy(folder);
	}

	// Rename _id to id
	_folder.id = _folder.id;
	delete _folder.id;

	if (opts.detail) {
		const childFoldersCount = await DriveFolder.count({
			parentId: _folder.id
		});

		const childFilesCount = await DriveFile.count({
			'metadata.folderId': _folder.id
		});

		_folder.foldersCount = childFoldersCount;
		_folder.filesCount = childFilesCount;
	}

	if (opts.detail && _folder.parentId) {
		// Populate parent folder
		_folder.parent = await pack(_folder.parentId, {
			detail: true
		});
	}

	resolve(_folder);
});
