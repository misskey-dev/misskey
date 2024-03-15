/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiRole } from './Role.js';
import { MiUser } from './User.js';

@Entity('role_assignment')
@Index(['userId', 'roleId'], { unique: true })
export class MiRoleAssignment {
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
		comment: 'The role ID.',
	})
	public roleId: MiRole['id'];

	@ManyToOne(type => MiRole, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public role: MiRole | null;

	@Index()
	@Column('timestamp with time zone', {
		nullable: true,
	})
	public expiresAt: Date | null;
}
