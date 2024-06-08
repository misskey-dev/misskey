/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiUserList } from './UserList.js';

@Entity('user_list_membership')
@Index(['userId', 'userListId'], { unique: true })
export class MiUserListMembership {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column({
		...id(),
		comment: 'The user ID.',
	})
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index()
	@Column({
		...id(),
		comment: 'The list ID.',
	})
	public userListId: MiUserList['id'];

	@ManyToOne(type => MiUserList, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public userList: MiUserList | null;

	// タイムラインにその人のリプライまで含めるかどうか
	@Column('boolean', {
		default: false,
	})
	public withReplies: boolean;

	//#region Denormalized fields
	@Column({
		...id(),
	})
	public userListUserId: MiUser['id'];
	//#endregion
}
