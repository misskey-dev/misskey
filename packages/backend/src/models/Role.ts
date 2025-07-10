/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Column, PrimaryColumn } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

/**
 * ～かつ～
 * 複数の条件を同時に満たす場合のみ成立とする
 */
type CondFormulaValueAnd = {
	type: 'and';
	values: RoleCondFormulaValue[];
};

/**
 * ～または～
 * 複数の条件のうち、いずれかを満たす場合のみ成立とする
 */
type CondFormulaValueOr = {
	type: 'or';
	values: RoleCondFormulaValue[];
};

/**
 * ～ではない
 * 条件を満たさない場合のみ成立とする
 */
type CondFormulaValueNot = {
	type: 'not';
	value: RoleCondFormulaValue;
};

/**
 * ローカルユーザーのみ成立とする
 */
type CondFormulaValueIsLocal = {
	type: 'isLocal';
};

/**
 * リモートユーザーのみ成立とする
 */
type CondFormulaValueIsRemote = {
	type: 'isRemote';
};

/**
 * 既に指定のマニュアルロールにアサインされている場合のみ成立とする
 */
type CondFormulaValueRoleAssignedTo = {
	type: 'roleAssignedTo';
	roleId: string;
};

/**
 * サスペンド済みアカウントの場合のみ成立とする
 */
type CondFormulaValueIsSuspended = {
	type: 'isSuspended';
};

/**
 * 鍵アカウントの場合のみ成立とする
 */
type CondFormulaValueIsLocked = {
	type: 'isLocked';
};

/**
 * botアカウントの場合のみ成立とする
 */
type CondFormulaValueIsBot = {
	type: 'isBot';
};

/**
 * 猫アカウントの場合のみ成立とする
 */
type CondFormulaValueIsCat = {
	type: 'isCat';
};

/**
 * やみモードを有効にしたアカウントの場合のみ成立とする
 */
type CondFormulaValueIsinYamiMode = {
	type: 'isInYamiMode';
};

/**
 * 「ユーザを見つけやすくする」が有効なアカウントの場合のみ成立とする
 */
type CondFormulaValueIsExplorable = {
	type: 'isExplorable';
};

/**
 * ユーザが作成されてから指定期間経過した場合のみ成立とする
 */
type CondFormulaValueCreatedLessThan = {
	type: 'createdLessThan';
	sec: number;
};

/**
 * ユーザが作成されてから指定期間経っていない場合のみ成立とする
 */
type CondFormulaValueCreatedMoreThan = {
	type: 'createdMoreThan';
	sec: number;
};

/**
 * フォロワー数が指定値以下の場合のみ成立とする
 */
type CondFormulaValueFollowersLessThanOrEq = {
	type: 'followersLessThanOrEq';
	value: number;
};

/**
 * フォロワー数が指定値以上の場合のみ成立とする
 */
type CondFormulaValueFollowersMoreThanOrEq = {
	type: 'followersMoreThanOrEq';
	value: number;
};

/**
 * フォロー数が指定値以下の場合のみ成立とする
 */
type CondFormulaValueFollowingLessThanOrEq = {
	type: 'followingLessThanOrEq';
	value: number;
};

/**
 * フォロー数が指定値以上の場合のみ成立とする
 */
type CondFormulaValueFollowingMoreThanOrEq = {
	type: 'followingMoreThanOrEq';
	value: number;
};

/**
 * 投稿数が指定値以下の場合のみ成立とする
 */
type CondFormulaValueNotesLessThanOrEq = {
	type: 'notesLessThanOrEq';
	value: number;
};

/**
 * 投稿数が指定値以上の場合のみ成立とする
 */
type CondFormulaValueNotesMoreThanOrEq = {
	type: 'notesMoreThanOrEq';
	value: number;
};

/**
 * 最終アクティブから指定期間未満の場合のみ成立とする
 */
type CondFormulaValueActivedMoreThan = {
	type: 'activedMoreThan';
	sec: number;
};

/**
 * 最終アクティブから指定期間以上経過している場合のみ成立とする
 */
type CondFormulaValueActivedLessThan = {
	type: 'activedLessThan';
	sec: number;
};

export type RoleCondFormulaValue = { id: string } & (
	CondFormulaValueAnd |
	CondFormulaValueOr |
	CondFormulaValueNot |
	CondFormulaValueIsLocal |
	CondFormulaValueIsRemote |
	CondFormulaValueIsSuspended |
	CondFormulaValueIsLocked |
	CondFormulaValueIsBot |
	CondFormulaValueIsCat |
	CondFormulaValueIsinYamiMode |
	CondFormulaValueIsExplorable |
	CondFormulaValueRoleAssignedTo |
	CondFormulaValueCreatedLessThan |
	CondFormulaValueCreatedMoreThan |
	CondFormulaValueFollowersLessThanOrEq |
	CondFormulaValueFollowersMoreThanOrEq |
	CondFormulaValueFollowingLessThanOrEq |
	CondFormulaValueFollowingMoreThanOrEq |
	CondFormulaValueNotesLessThanOrEq |
	CondFormulaValueNotesMoreThanOrEq |
	CondFormulaValueActivedMoreThan |
	CondFormulaValueActivedLessThan
);

@Entity('role')
export class MiRole {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The updated date of the Role.',
	})
	public updatedAt: Date;

	@Column('timestamp with time zone', {
		comment: 'The last used date of the Role.',
	})
	public lastUsedAt: Date;

	@Column('varchar', {
		length: 256,
	})
	public name: string;

	@Column('varchar', {
		length: 1024,
	})
	public description: string;

	@Column('varchar', {
		length: 256, nullable: true,
	})
	public color: string | null;

	@Column('varchar', {
		length: 512, nullable: true,
	})
	public iconUrl: string | null;

	@Column('enum', {
		enum: ['manual', 'conditional'],
		default: 'manual',
	})
	public target: 'manual' | 'conditional';

	@Column('jsonb', {
		default: { },
	})
	public condFormula: RoleCondFormulaValue;

	@Column('boolean', {
		default: false,
	})
	public isPublic: boolean;

	// trueの場合ユーザー名の横にバッジとして表示
	@Column('boolean', {
		default: false,
	})
	public asBadge: boolean;

	@Column('boolean', {
		default: false,
	})
	public isModerator: boolean;

	@Column('boolean', {
		default: false,
	})
	public isAdministrator: boolean;

	@Column('boolean', {
		default: false,
	})
	public isExplorable: boolean;

	@Column('boolean', {
		default: false,
	})
	public preserveAssignmentOnMoveAccount: boolean;

	@Column('boolean', {
		default: false,
	})
	public canEditMembersByModerator: boolean;

	// UIに表示する際の並び順用(大きいほど先頭)
	@Column('integer', {
		default: 0,
	})
	public displayOrder: number;

	@Column('jsonb', {
		default: { },
	})
	public policies: Record<string, {
		useDefault: boolean;
		priority: number;
		value: any;
	}>;

	@Column('boolean', {
		default: false,
		comment: 'Whether this role was created by community users (not admins)',
	})
	public isCommunity: boolean;
}
