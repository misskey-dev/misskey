/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, Column, PrimaryGeneratedColumn } from 'typeorm';
import { id } from '../id.js';
import type { User } from './User.js';

@Entity()
@Index(['userId', 'ip'], { unique: true })
export class UserIp {
	@PrimaryGeneratedColumn()
	public id: string;

	@Column('timestamp with time zone', {
	})
	public createdAt: Date;

	@Index()
	@Column(id())
	public userId: User['id'];

	@Column('varchar', {
		length: 128,
	})
	public ip: string;
}
