import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { DriveFiles, Followings, Users, Notes } from '@/models/index';
import { DriveFile } from '@/models/entities/drive-file';
import { Note } from '@/models/entities/note';
import { toPuny } from '@/misc/convert-host';
import { name, schema } from './entities/instance';

/**
 * インスタンスごとのチャート
 */
// eslint-disable-next-line import/no-default-export
export default class InstanceChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [
			notesCount,
			usersCount,
			followingCount,
			followersCount,
			driveFiles,
			//driveUsage,
		] = await Promise.all([
			Notes.count({ userHost: group }),
			Users.count({ host: group }),
			Followings.count({ followerHost: group }),
			Followings.count({ followeeHost: group }),
			DriveFiles.count({ userHost: group }),
			//DriveFiles.calcDriveUsageOfHost(group),
		]);

		return {
			'notes.total': notesCount,
			'users.total': usersCount,
			'following.total': followingCount,
			'followers.total': followersCount,
			'drive.totalFiles': driveFiles,
		};
	}

	@autobind
	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	public async requestReceived(host: string): Promise<void> {
		await this.commit({
			'requests.received': 1,
		}, toPuny(host));
	}

	@autobind
	public async requestSent(host: string, isSucceeded: boolean): Promise<void> {
		await this.commit({
			'requests.succeeded': isSucceeded ? 1 : 0,
			'requests.failed': isSucceeded ? 0 : 1,
		}, toPuny(host));
	}

	@autobind
	public async newUser(host: string): Promise<void> {
		await this.commit({
			'users.total': 1,
			'users.inc': 1,
		}, toPuny(host));
	}

	@autobind
	public async updateNote(host: string, note: Note, isAdditional: boolean): Promise<void> {
		await this.commit({
			'notes.total': isAdditional ? 1 : -1,
			'notes.inc': isAdditional ? 1 : 0,
			'notes.dec': isAdditional ? 0 : 1,
			'notes.diffs.normal': note.replyId == null && note.renoteId == null ? (isAdditional ? 1 : -1) : 0,
			'notes.diffs.renote': note.renoteId != null ? (isAdditional ? 1 : -1) : 0,
			'notes.diffs.reply': note.replyId != null ? (isAdditional ? 1 : -1) : 0,
			'notes.diffs.withFile': note.fileIds.length > 0 ? (isAdditional ? 1 : -1) : 0,
		}, toPuny(host));
	}

	@autobind
	public async updateFollowing(host: string, isAdditional: boolean): Promise<void> {
		await this.commit({
			'following.total': isAdditional ? 1 : -1,
			'following.inc': isAdditional ? 1 : 0,
			'following.dec': isAdditional ? 0 : 1,
		}, toPuny(host));
	}

	@autobind
	public async updateFollowers(host: string, isAdditional: boolean): Promise<void> {
		await this.commit({
			'followers.total': isAdditional ? 1 : -1,
			'followers.inc': isAdditional ? 1 : 0,
			'followers.dec': isAdditional ? 0 : 1,
		}, toPuny(host));
	}

	@autobind
	public async updateDrive(file: DriveFile, isAdditional: boolean): Promise<void> {
		const fileSizeKb = file.size / 1000;
		await this.commit({
			'drive.totalFiles': isAdditional ? 1 : -1,
			'drive.incFiles': isAdditional ? 1 : 0,
			'drive.incUsage': isAdditional ? fileSizeKb : 0,
			'drive.decFiles': isAdditional ? 1 : 0,
			'drive.decUsage': isAdditional ? fileSizeKb : 0,
		}, file.userHost);
	}
}
