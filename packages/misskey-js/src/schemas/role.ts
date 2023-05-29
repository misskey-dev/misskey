import type { JSONSchema7Definition } from 'schema-type';

export const packedRoleSchema = {
	$id: 'https://misskey-hub.net/api/schemas/Role',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		updatedAt: {
			type: 'string',
			format: 'date-time',
		},
		name: {
			type: 'string',
		},
		description: {
			type: 'string',
		},
		color: {
			type: ['string', 'null'],
		},
		iconUrl: {
			type: ['string', 'null'],
		},
		target: {
			enum: [
				'manual',
				'conditional',
			],
		},
		condFormula: {
			type: 'object',
			//$ref: 'https://misskey-hub.net/api/schemas/RoleCondFormula',
			// 循環参照なので難しい
			// のでschema-typeのproperty type assertionに頼る
		} as unknown as RoleCondFormulaValue,
		isPublic: {
			type: 'boolean',
		},
		isAdministrator: {
			type: 'boolean',
		},
		isModerator: {
			type: 'boolean',
		},
		isExplorable: {
			type: 'boolean',
		},
		asBadge: {
			type: 'boolean',
		},
		canEditMembersByModerator: {
			type: 'boolean',
		},
		displayOrder: {
			type: 'number',
		},
		policies: {
			type: 'object',
			additionalProperties: {
				$ref: 'https://misskey-hub.net/api/schemas/RolePolicy',
			},
		},
		usersCount: {
			type: 'number',
		},
	},
	required: [
		'id',
		'createdAt',
		'updatedAt',
		'name',
		'description',
		'color',
		'iconUrl',
		'target',
		'condFormula',
		'isPublic',
		'isAdministrator',
		'isModerator',
		'isExplorable',
		'asBadge',
		'canEditMembersByModerator',
		'displayOrder',
		'policies',
		'usersCount',
	],
} as const satisfies JSONSchema7Definition;

export const packedRoleAssignSchema = {
	$id: 'https://misskey-hub.net/api/schemas/RoleAssign',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
		user: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
		expiresAt: {
			oneOf: [{
				type: 'string',
				format: 'date-time',
			}, {
				type: 'null',
			}],
		},
	},
	required: [
		'id',
		'createdAt',
		'user',
		'expiresAt',
	],
} as const satisfies JSONSchema7Definition;

export const packedRolePolicySchema = {
	$id: 'https://misskey-hub.net/api/schemas/RolePolicy',

	type: 'object',
	properties: {
		useDefault: { type: 'boolean' },
		priority: { type: 'number' },
		value: { additionalProperties: true },
	},
	required: [
		'useDefault',
		'priority',
		'value',
	],
} as const satisfies JSONSchema7Definition;

export const packedRoleCondFormulaSchema = {
	$id: 'https://misskey-hub.net/api/schemas/RoleCondFormula',

	oneOf: [
		{ $ref: '#/$defs/and' },
		{ $ref: '#/$defs/or' },
		{ $ref: '#/$defs/not' },
		{ $ref: '#/$defs/isLocal' },
		{ $ref: '#/$defs/isRemote' },
		{ $ref: '#/$defs/createdLessThan' },
		{ $ref: '#/$defs/createdMoreThan' },
		{ $ref: '#/$defs/createdLessThanOrEq' },
		{ $ref: '#/$defs/createdMoreThanOrEq' },
		{ $ref: '#/$defs/followersLessThanOrEq' },
		{ $ref: '#/$defs/followersMoreThanOrEq' },
		{ $ref: '#/$defs/followingLessThanOrEq' },
		{ $ref: '#/$defs/followingMoreThanOrEq' },
		{ $ref: '#/$defs/notesLessThanOrEq' },
		{ $ref: '#/$defs/notesMoreThanOrEq' },
	],
	$defs: {
		and: {
			type: 'object',
			properties: {
				type: { const: 'and' },
				values: {
					type: 'array',
					items: { $ref: '#' },
				},
			},
			required: ['type', 'values'],
		},
		or: {
			type: 'object',
			properties: {
				type: { const: 'or' },
				values: {
					type: 'array',
					items: { $ref: '#' },
				},
			},
			required: ['type', 'values'],
		},
		not: {
			type: 'object',
			properties: {
				type: { const: 'not' },
				value: { $ref: '#' },
			},
			required: ['type', 'value'],
		},
		isLocal: {
			type: 'object',
			properties: {
				type: { const: 'isLocal' },
			},
			required: ['type'],
		},
		isRemote: {
			type: 'object',
			properties: {
				type: { const: 'isRemote' },
			},
			required: ['type'],
		},
		createdLessThan: {
			type: 'object',
			properties: {
				type: { const: 'createdLessThan' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		createdMoreThan: {
			type: 'object',
			properties: {
				type: { const: 'createdMoreThan' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		createdLessThanOrEq: {
			type: 'object',
			properties: {
				type: { const: 'createdLessThanOrEq' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		createdMoreThanOrEq: {
			type: 'object',
			properties: {
				type: { const: 'createdMoreThanOrEq' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		followersLessThanOrEq: {
			type: 'object',
			properties: {
				type: { const: 'followersLessThanOrEq' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		followersMoreThanOrEq: {
			type: 'object',
			properties: {
				type: { const: 'followersMoreThanOrEq' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		followingLessThanOrEq: {
			type: 'object',
			properties: {
				type: { const: 'followingLessThanOrEq' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		followingMoreThanOrEq: {
			type: 'object',
			properties: {
				type: { const: 'followingMoreThanOrEq' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		notesLessThanOrEq: {
			type: 'object',
			properties: {
				type: { const: 'notesLessThanOrEq' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
		notesMoreThanOrEq: {
			type: 'object',
			properties: {
				type: { const: 'notesMoreThanOrEq' },
				value: { type: 'number' },
			},
			required: ['type', 'value'],
		},
	}
} as const satisfies JSONSchema7Definition;

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

type CondFormulaValueNotesLessThanOrEq = {
	type: 'notesLessThanOrEq';
	value: number;
};

type CondFormulaValueNotesMoreThanOrEq = {
	type: 'notesMoreThanOrEq';
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
	CondFormulaValueFollowingMoreThanOrEq |
	CondFormulaValueNotesLessThanOrEq |
	CondFormulaValueNotesMoreThanOrEq;
