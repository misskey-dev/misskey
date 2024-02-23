/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';

@Entity('oauth2_server')
export class MiOAuth2Server {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the OAuth2Client.',
	})
	public updatedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public title: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public description?: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public clientId?: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public clientSecret?: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public authorizeUrl?: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public tokenUrl?: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public signUpUrl?: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public scope?: string;

	@Column('varchar', {
		length: 1024, nullable: true,
	})
	public profileUrl?: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public idPath?: string; // determiner to same account authorized by OAuth2

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public usernamePath?: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public namePath?: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public emailPath?: string;

	@Column('boolean', {
		default: false,
	})
	public markEmailAsVerified: boolean;

	@Column('boolean', {
		default: false,
	})
	public allowSignUp: boolean;
}

export const titleSchema = { type: 'string', minLength: 1, maxLength: 256 } as const;
