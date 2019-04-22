import { EntityRepository, Repository } from 'typeorm';
import { DriveFile } from '../entities/drive-file';
import { Users, DriveFolders } from '..';
import { User } from '../entities/user';
import { toPuny } from '../../misc/convert-host';
import { ensure } from '../../prelude/ensure';

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

	public getPublicUrl(file: DriveFile, thumbnail = false): string | null {
		return thumbnail ? (file.thumbnailUrl || file.webpublicUrl || null) : (file.webpublicUrl || file.url);
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
			.where('file.userHost = :host', { host: toPuny(host) })
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
		src: DriveFile['id'] | DriveFile,
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

		const file = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await rap({
			id: file.id,
			createdAt: file.createdAt,
			name: file.name,
			type: file.type,
			md5: file.md5,
			size: file.size,
			isSensitive: file.isSensitive,
			properties: file.properties,
			url: opts.self ? file.url : this.getPublicUrl(file, false),
			thumbnailUrl: this.getPublicUrl(file, true),
			folderId: file.folderId,
			folder: opts.detail && file.folderId ? DriveFolders.pack(file.folderId, {
				detail: true
			}) : null,
			user: opts.withUser ? Users.pack(file.userId!) : null
		});
	}
}
