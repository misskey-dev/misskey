/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Index, JoinColumn, Column, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiAntenna } from './Antenna.js';

@Entity('antenna_favorite')
@Index(['userId', 'antennaId'], { unique: true })
export class MiAntennaFavorite {
	@PrimaryColumn(id())
	public id: string;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Column(id())
	public antennaId: MiAntenna['id'];

	@ManyToOne(() => MiAntenna, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public antenna: MiAntenna | null;
}
