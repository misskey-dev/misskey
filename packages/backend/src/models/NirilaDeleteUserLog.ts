/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, Column } from 'typeorm';
import { MiUserProfile } from '@/models/UserProfile.js';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('nirila_delete_user_log')
export class NirilaDeleteUserLog {
	// delete user log id
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@Index()
	@Column('varchar', {
		length: 128,
		comment: 'The username of the deleted User.',
	})
	public username: MiUser['username'];

	@Index()
	@Column('varchar', {
		length: 128, nullable: true,
		comment: 'The email adddress of the deleted User.',
	})
	public email: MiUserProfile['email'];

	// user profile info
	@Column('jsonb')
	public info: Record<string, any>;
}
