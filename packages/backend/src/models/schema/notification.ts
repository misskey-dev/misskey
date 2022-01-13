import { notificationTypes } from "@/types";

export const packedNotificationSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
		},
		isRead: {
			type: 'boolean' as const,
			optional: false as const, nullable: false as const,
		},
		type: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			enum: [...notificationTypes],
		},
		user: {
			type: 'object' as const,
			ref: 'User' as const,
			optional: true as const, nullable: true as const,
		},
		userId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
		},
		note: {
			type: 'object' as const,
			ref: 'Note' as const,
			optional: true as const, nullable: true as const,
		},
		reaction: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
		choice: {
			type: 'number' as const,
			optional: true as const, nullable: true as const,
		},
		invitation: {
			type: 'object' as const,
			optional: true as const, nullable: true as const,
		},
		body: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
		header: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
		icon: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
		},
	},
};
