/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MiRole } from './Role.js';
import { MiUser } from './User.js';
import { id } from './util/id.js';

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

	@ManyToOne(() => MiUser, {
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

	@ManyToOne(() => MiRole, {
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
