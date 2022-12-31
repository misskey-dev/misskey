import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from '../id.js';

const rolePermissions = [
	'suspend',
	'silence',
	'viewAbuseUserReports',
	'deleteAccount',
	'manageAds',
	'createAnnouncement',
	'deleteAnnouncement',
	'updateAnnouncement',
	'updateEmoji',
	'createEmoji',
	'deleteEmoji',
	'refreshRemoteInstanceMetadata',
	'invite',
	'addRelay',
	'removeRelay',
	'resetPassword',
	'resolveAbuseUserReports',
	'showUserDetails',
	'createRole',
	'readRole',
	'updateole',
	'deleteRole',
	'assignRole',
] as const;

@Entity()
export class Role {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the Role.',
	})
	public createdAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the Role.',
	})
	public updatedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public name: string;

	@Column('varchar', {
		length: 1024,
	})
	public description: string;

	@Column('boolean', {
		default: false,
	})
	public isPublic: boolean;

	@Column('varchar', {
		length: 128, array: true, default: '{}',
	})
	public permissions: (typeof rolePermissions)[number][];
}
