import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { DriveFiles, Followings, Users, Notes } from '../../../../models';
import { DriveFile } from '../../../../models/entities/drive-file';
import { name, schema } from '../schemas/instance';

type InstanceLog = SchemaType<typeof schema>;

export default class InstanceChart extends Chart<InstanceLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest?: InstanceLog): InstanceLog {
		return {
			requests: {
				failed: 0,
				succeeded: 0,
				received: 0
			},
			notes: {
				total: latest ? latest.notes.total : 0,
				inc: 0,
				dec: 0
			},
			users: {
				total: latest ? latest.users.total : 0,
				inc: 0,
				dec: 0
			},
			following: {
				total: latest ? latest.following.total : 0,
				inc: 0,
				dec: 0
			},
			followers: {
				total: latest ? latest.followers.total : 0,
				inc: 0,
				dec: 0
			},
			drive: {
				totalFiles: latest ? latest.drive.totalFiles : 0,
				totalUsage: latest ? latest.drive.totalUsage : 0,
				incFiles: 0,
				incUsage: 0,
				decFiles: 0,
				decUsage: 0
			}
		};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<InstanceLog>> {
		const [
			notesCount,
			usersCount,
			followingCount,
			followersCount,
			driveFiles,
			driveUsage,
		] = await Promise.all([
			Notes.count({ userHost: group }),
			Users.count({ host: group }),
			Followings.count({ followerHost: group }),
			Followings.count({ followeeHost: group }),
			DriveFiles.count({ userHost: group }),
			DriveFiles.clacDriveUsageOfHost(group),
		]);

		return {
			notes: {
				total: notesCount,
			},
			users: {
				total: usersCount,
			},
			following: {
				total: followingCount,
			},
			followers: {
				total: followersCount,
			},
			drive: {
				totalFiles: driveFiles,
				totalUsage: driveUsage,
			}
		};
	}

	@autobind
	public async requestReceived(host: string) {
		await this.inc({
			requests: {
				received: 1
			}
		}, host);
	}

	@autobind
	public async requestSent(host: string, isSucceeded: boolean) {
		const update: Obj = {};

		if (isSucceeded) {
			update.succeeded = 1;
		} else {
			update.failed = 1;
		}

		await this.inc({
			requests: update
		}, host);
	}

	@autobind
	public async newUser(host: string) {
		await this.inc({
			users: {
				total: 1,
				inc: 1
			}
		}, host);
	}

	@autobind
	public async updateNote(host: string, isAdditional: boolean) {
		await this.inc({
			notes: {
				total: isAdditional ? 1 : -1,
				inc: isAdditional ? 1 : 0,
				dec: isAdditional ? 0 : 1,
			}
		}, host);
	}

	@autobind
	public async updateFollowing(host: string, isAdditional: boolean) {
		await this.inc({
			following: {
				total: isAdditional ? 1 : -1,
				inc: isAdditional ? 1 : 0,
				dec: isAdditional ? 0 : 1,
			}
		}, host);
	}

	@autobind
	public async updateFollowers(host: string, isAdditional: boolean) {
		await this.inc({
			followers: {
				total: isAdditional ? 1 : -1,
				inc: isAdditional ? 1 : 0,
				dec: isAdditional ? 0 : 1,
			}
		}, host);
	}

	@autobind
	public async updateDrive(file: DriveFile, isAdditional: boolean) {
		const update: Obj = {};

		update.totalFiles = isAdditional ? 1 : -1;
		update.totalUsage = isAdditional ? file.size : -file.size;
		if (isAdditional) {
			update.incFiles = 1;
			update.incUsage = file.size;
		} else {
			update.decFiles = 1;
			update.decUsage = file.size;
		}

		await this.inc({
			drive: update
		}, file.userHost);
	}
}
