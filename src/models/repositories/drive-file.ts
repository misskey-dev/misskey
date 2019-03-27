import { EntityRepository, Repository } from 'typeorm';
import { DriveFile } from '../entities/drive-file';
import { Users, DriveFolders } from '..';
import rap from '@prezzemolo/rap';
import { User } from '../entities/user';

@EntityRepository(DriveFile)
export class DriveFileRepository extends Repository<DriveFile> {
	public validateFileName(name: string): boolean {
		return (
			(name.trim().length > 0) &&
			(name.length <= 200) &&
			(name.indexOf('\\') === -1) &&
			(name.indexOf('/') === -1) &&
			(name.indexOf('..') === -1)
		);
	}

	public getPublicUrl(file: DriveFile): string {
		return file.webpublicUrl || file.thumbnailUrl || file.url;
	}

	public async clacDriveUsageOf(user: User['id'] | User): Promise<number> {
		const id = typeof user === 'object' ? user.id : user;

		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userId = :id', { id: id })
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async clacDriveUsageOfHost(host: string): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost = :host', { host: host })
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async clacDriveUsageOfLocal(): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost IS NULL')
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async clacDriveUsageOfRemote(): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost IS NOT NULL')
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public packMany(
		files: any[],
		options?: {
			detail?: boolean
			self?: boolean,
			withUser?: boolean,
		}
	) {
		return Promise.all(files.map(f => this.pack(f, options)));
	}

	public async pack(
		file: DriveFile['id'] | DriveFile,
		options?: {
			detail?: boolean,
			self?: boolean,
			withUser?: boolean,
		}
	) {
		const opts = Object.assign({
			detail: false,
			self: false
		}, options);

		const _file = typeof file === 'object' ? file : await this.findOne(file);

		return await rap({
			id: _file.id,
			createdAt: _file.createdAt,
			name: _file.name,
			type: _file.type,
			md5: _file.md5,
			size: _file.size,
			isSensitive: _file.isSensitive,
			folder: opts.detail && _file.folderId ? DriveFolders.pack(_file.folderId, {
				detail: true
			}) : null,
			user: opts.withUser ? Users.pack(_file.userId) : null
		});
	}
}
