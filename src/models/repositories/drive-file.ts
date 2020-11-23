import { EntityRepository, Repository } from 'typeorm';
import { DriveFile } from '../entities/drive-file';
import { Users, DriveFolders } from '..';
import { User } from '../entities/user';
import { toPuny } from '../../misc/convert-host';
import { ensure } from '../../prelude/ensure';
import { awaitAll } from '../../prelude/await-all';
import { SchemaType } from '../../misc/schema';
import config from '../../config';
import { query, appendQuery } from '../../prelude/url';
import { Meta } from '../entities/meta';
import { fetchMeta } from '../../misc/fetch-meta';

export type PackedDriveFile = SchemaType<typeof packedDriveFileSchema>;

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

	public getPublicUrl(file: DriveFile, thumbnail = false, meta?: Meta): string | null {
		// リモートかつメディアプロキシ
		if (file.uri != null && file.userHost != null && config.mediaProxy != null) {
			return appendQuery(config.mediaProxy, query({
				url: file.uri,
				thumbnail: thumbnail ? '1' : undefined
			}));
		}

		// リモートかつ期限切れはローカルプロキシを試みる
		if (file.uri != null && file.isLink && meta && meta.proxyRemoteFiles) {
			const key = thumbnail ? file.thumbnailAccessKey : file.webpublicAccessKey;

			if (key && !key.match('/')) {	// 古いものはここにオブジェクトストレージキーが入ってるので除外
				return `${config.url}/files/${key}`;
			}
		}

		const isImage = file.type && ['image/png', 'image/apng', 'image/gif', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type);

		return thumbnail ? (file.thumbnailUrl || (isImage ? (file.webpublicUrl || file.url) : null)) : (file.webpublicUrl || file.url);
	}

	public async calcDriveUsageOf(user: User['id'] | User): Promise<number> {
		const id = typeof user === 'object' ? user.id : user;

		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userId = :id', { id: id })
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async calcDriveUsageOfHost(host: string): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost = :host', { host: toPuny(host) })
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async calcDriveUsageOfLocal(): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost IS NULL')
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async calcDriveUsageOfRemote(): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost IS NOT NULL')
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async pack(
		src: DriveFile['id'] | DriveFile,
		options?: {
			detail?: boolean,
			self?: boolean,
			withUser?: boolean,
		}
	): Promise<PackedDriveFile> {
		const opts = Object.assign({
			detail: false,
			self: false
		}, options);

		const file = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		const meta = await fetchMeta();

		return await awaitAll({
			id: file.id,
			createdAt: file.createdAt.toISOString(),
			name: file.name,
			type: file.type,
			md5: file.md5,
			size: file.size,
			isSensitive: file.isSensitive,
			blurhash: file.blurhash,
			properties: file.properties,
			url: opts.self ? file.url : this.getPublicUrl(file, false, meta),
			thumbnailUrl: this.getPublicUrl(file, true, meta),
			comment: file.comment,
			folderId: file.folderId,
			folder: opts.detail && file.folderId ? DriveFolders.pack(file.folderId, {
				detail: true
			}) : null,
			userId: opts.withUser ? file.userId : null,
			user: (opts.withUser && file.userId) ? Users.pack(file.userId) : null
		});
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
}

export const packedDriveFileSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			description: 'The unique identifier for this Drive file.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
			description: 'The date that the Drive file was created on Misskey.'
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			description: 'The file name with extension.',
			example: 'lenna.jpg'
		},
		type: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			description: 'The MIME type of this Drive file.',
			example: 'image/jpeg'
		},
		md5: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'md5',
			description: 'The MD5 hash of this Drive file.',
			example: '15eca7fba0480996e2245f5185bf39f2'
		},
		size: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			description: 'The size of this Drive file. (bytes)',
			example: 51469
		},
		url: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'url',
			description: 'The URL of this Drive file.',
		},
		folderId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			description: 'The parent folder ID of this Drive file.',
			example: 'xxxxxxxxxx',
		},
		isSensitive: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
			description: 'Whether this Drive file is sensitive.',
		},
	},
};
