import type { JSONSchema7Definition } from 'schema-type';

export const packedQueueCountSchema = {
	$id: 'https://misskey-hub.net/api/schemas/QueueCount',

	type: 'object',
	properties: {
		waiting: {
			type: 'number',
		},
		active: {
			type: 'number',
		},
		completed: {
			type: 'number',
		},
		failed: {
			type: 'number',
		},
		delayed: {
			type: 'number',
		},
	},
	required: [
		'waiting',
		'active',
		'completed',
		'failed',
		'delayed',
	],
} as const satisfies JSONSchema7Definition;
