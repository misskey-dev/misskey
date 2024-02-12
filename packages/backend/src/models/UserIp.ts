/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryGeneratedColumn } from 'typeorm';
import { id } from './util/id.js';
import type { MiUser } from './User.js';

@Entity('user_ip')
@Index(['userId', 'ip'], { unique: true })
export class MiUserIp {
	@PrimaryGeneratedColumn()
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		comment: 'The created date of the UserIp.',
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@Column('varchar', {
		length: 128,
	})
	public ip: string;
}
