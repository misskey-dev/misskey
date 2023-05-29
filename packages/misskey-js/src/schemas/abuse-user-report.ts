import type { JSONSchema7Definition } from 'schema-type';

export const packedAbuseUserReportSchema = {
	$id: 'https://misskey-hub.net/api/schemas/AbuseUserReport',

	type: 'object',
	properties: {
		id: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		createdAt: {
			type: 'string',
			format: 'date-time',
		},
        comment: {
			type: 'string',
		},
		resolved: {
			type: 'boolean',
			examples: [false],
		},
		reporterId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		reporter: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
		targetUserId: { $ref: 'https://misskey-hub.net/api/schemas/Id' },
		targetUser: { $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
		assigneeId: {
			oneOf: [
				{ $ref: 'https://misskey-hub.net/api/schemas/Id' },
				{ type: 'null' },
			]
		},
		assignee: {
			oneOf: [
				{ $ref: 'https://misskey-hub.net/api/schemas/UserDetailed' },
				{ type: 'null' },
			]
		},
		forwarded: {
			type: 'boolean',
		},
    },
    required: [
        'id',
        'createdAt',
		'comment',
		'resolved',
		'reporterId',
		'reporter',
		'targetUserId',
		'targetUser',
		'assigneeId',
		'forwarded',
    ],
} as const satisfies JSONSchema7Definition;
