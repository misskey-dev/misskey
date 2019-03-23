import { EntityRepository, Repository } from 'typeorm';
import { DriveFile } from '../entities/drive-file';
import { Users } from '..';

@EntityRepository(DriveFile)
export class DriveFileRepository extends Repository<DriveFile> {
	private async cloneOrFetch(x: DriveFile['id'] | DriveFile): Promise<DriveFile> {
		if (typeof x === 'object') {
			return JSON.parse(JSON.stringify(x));
		} else {
			return await this.findOne(x);
		}
	}

	public validateFileName(name: string): boolean {
		return (
			(name.trim().length > 0) &&
			(name.length <= 200) &&
			(name.indexOf('\\') === -1) &&
			(name.indexOf('/') === -1) &&
			(name.indexOf('..') === -1)
		);
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
		file: any,
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

		const _file = await this.cloneOrFetch(file);

		return {
			folder: opts.detail && _file.folderId ? await packFolder(_file.folderId, {
				detail: true
			}) : null,
			user: opts.withUser ? await Users.pack(_file.userId) : null
		};
	}
}
