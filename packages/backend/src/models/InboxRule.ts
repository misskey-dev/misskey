/*
 * SPDX-FileCopyrightText: Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * ～かつ～
 * 複数の条件を同時に満たす場合のみ成立とする
 */
type CondFormulaValueAnd = {
	type: 'and';
	values: InboxRuleCondFormulaValue[];
};

/**
 * ～または～
 * 複数の条件のうち、いずれかを満たす場合のみ成立とする
 */
type CondFormulaValueOr = {
	type: 'or';
	values: InboxRuleCondFormulaValue[];
};

/**
 * ～ではない
 * 条件を満たさない場合のみ成立とする
 */
type CondFormulaValueNot = {
	type: 'not';
	value: InboxRuleCondFormulaValue;
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

type CondFormulaValueMaxMentionsMoreThanOrEq = {
	type: 'maxMentionsMoreThanOrEq';
	value: number;
};

type CondFormulaValueAttachmentFileMoreThanOrEq = {
	type: 'attachmentFileMoreThanOrEq';
	value: number;
};

type CondFormulaValueIsIncludeThisWord = {
	type: 'isIncludeThisWord';
	value: string;
};

type CondFormulaValueServerHost = {
	type: 'serverHost';
	value: string;
};

type CondFormulaValueServerSoftware = {
	type: 'serverSoftware';
	value: string;
};

type CondFormulaValueServerIsSilenced = {
	type: 'serverIsSilenced';
};

type CondFormulaValueServerPubLessThanOrEq = {
	type : 'serverPubLessThanOrEq'
	value: number;
}

type CondFormulaValueServerPubMoreThanOrEq = {
	type : 'serverPubMoreThanOrEq'
	value: number;
}

type CondFormulaValueServerSubLessThanOrEq = {
	type : 'serverSubLessThanOrEq'
	value: number;
}

type CondFormulaValueServerSubMoreThanOrEq = {
	type : 'serverSubMoreThanOrEq'
	value: number;
}

export type InboxRuleCondFormulaValue = { id: string } & (
	CondFormulaValueAnd |
	CondFormulaValueOr |
	CondFormulaValueNot |
	CondFormulaValueIsSuspended |
	CondFormulaValueIsLocked |
	CondFormulaValueIsBot |
	CondFormulaValueIsCat |
	CondFormulaValueCreatedLessThan |
	CondFormulaValueCreatedMoreThan |
	CondFormulaValueFollowersLessThanOrEq |
	CondFormulaValueFollowersMoreThanOrEq |
	CondFormulaValueFollowingLessThanOrEq |
	CondFormulaValueFollowingMoreThanOrEq |
	CondFormulaValueNotesLessThanOrEq |
	CondFormulaValueNotesMoreThanOrEq |
	CondFormulaValueMaxMentionsMoreThanOrEq |
	CondFormulaValueAttachmentFileMoreThanOrEq |
	CondFormulaValueIsIncludeThisWord |
	CondFormulaValueServerHost |
	CondFormulaValueServerSoftware |
	CondFormulaValueServerIsSilenced |
	CondFormulaValueServerPubLessThanOrEq |
	CondFormulaValueServerPubMoreThanOrEq |
	CondFormulaValueServerSubLessThanOrEq |
	CondFormulaValueServerSubMoreThanOrEq
	);

export type InboxRuleAction = {
	type: 'reject' | 'messageRewrite';
	rewrite?: string | null | undefined;
}

import { PrimaryColumn, Entity, Column } from 'typeorm';
import { id } from './util/id.js';

@Entity('inbox_rule')
export class MiInboxRule {
	@PrimaryColumn(id())
	public id: string;

	@Column('varchar', {
		length: 128,
	})
	public name: string;

	@Column('varchar', {
		length: 256,
	})
	public description: string;

	@Column('jsonb', {
		default: { },
	})
	public condFormula: InboxRuleCondFormulaValue;

	@Column('jsonb', {})
	public action: InboxRuleAction;
}
