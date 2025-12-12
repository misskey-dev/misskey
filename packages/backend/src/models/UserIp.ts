/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { MiUser } from './User.js';
import { id } from './util/id.js';

@Entity('user_ip')
@Index(['userId', 'ip'], { unique: true })
export class MiUserIp {
	@PrimaryGeneratedColumn()
	public id: string;

	@Column('timestamp with time zone', {
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
