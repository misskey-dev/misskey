import { Entity, Column, PrimaryColumn } from 'typeorm';
import { id } from '../id.js';

type CondFormulaValueAnd = {
	type: 'and';
	values: RoleCondFormulaValue[];
};

type CondFormulaValueOr = {
	type: 'or';
	values: RoleCondFormulaValue[];
};

type CondFormulaValueNot = {
	type: 'not';
	value: RoleCondFormulaValue;
};

type CondFormulaValueIsLocal = {
	type: 'isLocal';
};

type CondFormulaValueIsRemote = {
	type: 'isRemote';
};

type CondFormulaValueCreatedLessThan = {
	type: 'createdLessThan';
	sec: number;
};

type CondFormulaValueCreatedMoreThan = {
	type: 'createdMoreThan';
	sec: number;
};

type CondFormulaValueFollowersLessThanOrEq = {
	type: 'followersLessThanOrEq';
	value: number;
};

type CondFormulaValueFollowersMoreThanOrEq = {
	type: 'followersMoreThanOrEq';
	value: number;
};

type CondFormulaValueFollowingLessThanOrEq = {
	type: 'followingLessThanOrEq';
	value: number;
};

type CondFormulaValueFollowingMoreThanOrEq = {
	type: 'followingMoreThanOrEq';
	value: number;
};

export type RoleCondFormulaValue =
	CondFormulaValueAnd |
	CondFormulaValueOr |
	CondFormulaValueNot |
	CondFormulaValueIsLocal |
	CondFormulaValueIsRemote |
	CondFormulaValueCreatedLessThan |
	CondFormulaValueCreatedMoreThan |
	CondFormulaValueFollowersLessThanOrEq |
	CondFormulaValueFollowersMoreThanOrEq |
	CondFormulaValueFollowingLessThanOrEq |
	CondFormulaValueFollowingMoreThanOrEq;

@Entity()
export class Role {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone', {
		comment: 'The created date of the Role.',
	})
	public createdAt: Date;

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
}
