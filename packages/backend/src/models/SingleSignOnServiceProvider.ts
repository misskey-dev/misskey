/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, Column, Index } from 'typeorm';

@Entity('sso_service_provider')
export class MiSingleSignOnServiceProvider {
	@PrimaryColumn('varchar', {
		length: 36,
	})
	public id: string;

	@Index()
	@Column('timestamp with time zone', {
		default: () => 'CURRENT_TIMESTAMP',
	})
	public createdAt: Date;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public name: string | null;

	@Column('enum', {
		enum: ['saml', 'jwt'],
		nullable: false,
	})
	public type: 'saml' | 'jwt';

	@Column('varchar', {
		length: 512,
	})
	public issuer: string;

	@Column('varchar', {
		array: true, length: 512, default: '{}',
	})
	public audience: string[];

	@Column('enum', {
		enum: ['post', 'redirect'],
		nullable: false,
	})
	public binding: 'post' | 'redirect';

	@Column('varchar', {
		length: 512,
	})
	public acsUrl: string;

	@Column('varchar', {
		length: 4096,
	})
	public publicKey: string;

	@Column('varchar', {
		length: 4096, nullable: true,
	})
	public privateKey: string | null;

	@Column('varchar', {
		length: 100,
	})
	public signatureAlgorithm: string;

	@Column('varchar', {
		length: 100, nullable: true,
	})
	public cipherAlgorithm: string | null;

	@Column('boolean', {
		default: false,
	})
	public wantAuthnRequestsSigned: boolean;

	@Column('boolean', {
		default: true,
	})
	public wantAssertionsSigned: boolean;
}
