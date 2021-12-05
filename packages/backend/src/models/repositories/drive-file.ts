import { EntityRepository, Repository } from 'typeorm';
import { DriveFile } from '@/models/entities/drive-file';
import { Users, DriveFolders } from '../index';
import { User } from '@/models/entities/user';
import { toPuny } from '@/misc/convert-host';
import { awaitAll } from '@/prelude/await-all';
import { Packed } from '@/misc/schema';
import config from '@/config/index';
import { query, appendQuery } from '@/prelude/url';
import { Meta } from '@/models/entities/meta';
import { fetchMeta } from '@/misc/fetch-meta';

type PackOptions = {
	detail?: boolean,
	self?: boolean,
	withUser?: boolean,
};

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

	public getPublicProperties(file: DriveFile): DriveFile['properties'] {
		if (file.properties.orientation != null) {
			const properties = JSON.parse(JSON.stringify(file.properties));
			if (file.properties.orientation >= 5) {
				[properties.width, properties.height] = [properties.height, properties.width];
			}
			properties.orientation = undefined;
			return properties;
		}

		return file.properties;
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

	public async calcDriveUsageOf(user: User['id'] | { id: User['id'] }): Promise<number> {
		const id = typeof user === 'object' ? user.id : user;

		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userId = :id', { id: id })
			.andWhere('file.isLink = FALSE')
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async calcDriveUsageOfHost(host: string): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost = :host', { host: toPuny(host) })
			.andWhere('file.isLink = FALSE')
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async calcDriveUsageOfLocal(): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost IS NULL')
			.andWhere('file.isLink = FALSE')
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async calcDriveUsageOfRemote(): Promise<number> {
		const { sum } = await this
			.createQueryBuilder('file')
			.where('file.userHost IS NOT NULL')
			.andWhere('file.isLink = FALSE')
			.select('SUM(file.size)', 'sum')
			.getRawOne();

		return parseInt(sum, 10) || 0;
	}

	public async pack(src: DriveFile['id'], options?: PackOptions): Promise<Packed<'DriveFile'> | null>;
	public async pack(src: DriveFile, options?: PackOptions): Promise<Packed<'DriveFile'>>;
	public async pack(
		src: DriveFile['id'] | DriveFile,
		options?: PackOptions
	): Promise<Packed<'DriveFile'> | null> {
		const opts = Object.assign({
			detail: false,
			self: false
		}, options);

		const file = typeof src === 'object' ? src : await this.findOne(src);
		if (file == null) return null;

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
			properties: opts.self ? file.properties : this.getPublicProperties(file),
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

	public async packMany(
		files: (DriveFile['id'] | DriveFile)[],
		options?: PackOptions
	) {
		const items = await Promise.all(files.map(f => this.pack(f, options)));
		return items.filter(x => x != null);
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
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		name: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			example: 'lenna.jpg'
		},
		type: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			example: 'image/jpeg'
		},
		md5: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'md5',
			example: '15eca7fba0480996e2245f5185bf39f2'
		},
		size: {
			type: 'number' as const,
			optional: false as const, nullable: false as const,
			example: 51469
		},
		isSensitive: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		blurhash: {
			type: 'string' as const,
			optional: false as const, nullable: true as const
		},
		properties: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				width: {
					type: 'number' as const,
					optional: true as const, nullable: false as const,
					example: 1280
				},
				height: {
					type: 'number' as const,
					optional: true as const, nullable: false as const,
					example: 720
				},
				orientation: {
					type: 'number' as const,
					optional: true as const, nullable: false as const,
					example: 8
				},
				avgColor: {
					type: 'string' as const,
					optional: true as const, nullable: false as const,
					example: 'rgb(40,65,87)'
				}
			}
		},
		url: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'url',
		},
		thumbnailUrl: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'url',
		},
		comment: {
			type: 'string' as const,
			optional: false as const, nullable: true as const
		},
		folderId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		folder: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'DriveFolder' as const,
		},
		userId: {
			type: 'string' as const,
			optional: false as const, nullable: true as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		user: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
			ref: 'User' as const,
		}
	},
};
