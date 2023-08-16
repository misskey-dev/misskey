/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Column } from 'typeorm';

@Entity()
export class UsedUsername {
	@PrimaryColumn('varchar', {
		length: 128,
	})
	public username: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	constructor(data: Partial<UsedUsername>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
