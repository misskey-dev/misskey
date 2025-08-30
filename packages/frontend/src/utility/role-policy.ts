/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n.js';
import type {
	RolePolicyDef,
	GetRolePolicyEditorValuesType,
	RolePolicyValueRecord as _RolePolicyValueRecord,
	RolePolicySettingsRecord as _RolePolicySettingsRecord,
} from '@/types/role-policy-editor.js';

export const rolePolicyDef = {
	rateLimitFactor: {
		type: 'range',
		displayLabel: i18n.ts._role._options.rateLimitFactor,
		displayValue: (value) => `${Math.round(value * 100)}%`,
		min: 0.3,
		max: 3,
		step: 0.1,
		textConverter: (value) => `${Math.round(value * 100)}%`,
		inputCaption: i18n.ts._role._options.descriptionOfRateLimitFactor,
	},
	gtlAvailable: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.gtlAvailable,
	},
	ltlAvailable: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.ltlAvailable,
	},
	canPublicNote: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canPublicNote,
	},
	chatAvailability: {
		type: 'enum',
		displayLabel: i18n.ts._role._options.chatAvailability,
		enum: [
			{ label: i18n.ts.enabled, value: 'available' as const },
			{ label: i18n.ts.readonly, value: 'readonly' as const },
			{ label: i18n.ts.disabled, value: 'unavailable' as const },
		],
	},
	mentionLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.mentionMax,
	},
	canInvite: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canInvite,
	},
	inviteLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.inviteLimit,
	},
	inviteLimitCycle: {
		type: 'number',
		displayLabel: i18n.ts._role._options.inviteLimitCycle,
		displayValue: (value) => `${value} ${i18n.ts._time.minute}`,
		inputSuffix: i18n.ts._time.minute,
	},
	inviteExpirationTime: {
		type: 'number',
		displayLabel: i18n.ts._role._options.inviteExpirationTime,
		displayValue: (value) => `${value} ${i18n.ts._time.minute}`,
		inputSuffix: i18n.ts._time.minute,
	},
	canManageAvatarDecorations: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canManageAvatarDecorations,
	},
	canManageCustomEmojis: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canManageCustomEmojis,
	},
	canSearchNotes: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canSearchNotes,
	},
	canSearchUsers: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canSearchUsers,
	},
	canUseTranslator: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canUseTranslator,
	},
	driveCapacityMb: {
		type: 'number',
		displayLabel: i18n.ts._role._options.driveCapacity,
		displayValue: (value) => `${value} MB`,
		inputSuffix: 'MB',
	},
	maxFileSizeMb: {
		type: 'number',
		displayLabel: i18n.ts._role._options.maxFileSize,
		displayValue: (value) => `${value} MB`,
		inputSuffix: 'MB',
	},
	uploadableFileTypes: {
		type: 'string',
		multiline: true,
		displayLabel: i18n.ts._role._options.uploadableFileTypes,
		displayValue: (value, full) => full === true ? Array.isArray(value) ? value.join(', ') : value : '...',
		inputCaption: defineAsyncComponent(() => import('@/pages/admin/roles.policy-editor.uploadableFileTypesCaption.vue')),
	},
	alwaysMarkNsfw: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.alwaysMarkNsfw,
	},
	canUpdateBioMedia: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canUpdateBioMedia,
	},
	pinLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.pinMax,
	},
	antennaLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.antennaMax,
	},
	wordMuteLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.wordMuteMax,
		inputSuffix: 'chars',
	},
	webhookLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.webhookMax,
	},
	clipLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.clipMax,
	},
	noteEachClipsLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.noteEachClipsMax,
	},
	userListLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.userListMax,
	},
	userEachUserListsLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.userEachUserListsMax,
	},
	canHideAds: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canHideAds,
	},
	avatarDecorationLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.avatarDecorationLimit,
		min: 0,
		max: 16,
	},
	canImportAntennas: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canImportAntennas,
	},
	canImportBlocking: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canImportBlocking,
	},
	canImportFollowing: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canImportFollowing,
	},
	canImportMuting: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canImportMuting,
	},
	canImportUserLists: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.canImportUserLists,
	},
	noteDraftLimit: {
		type: 'number',
		displayLabel: i18n.ts._role._options.noteDraftLimit,
		min: 0,
	},
	watermarkAvailable: {
		type: 'boolean',
		displayLabel: i18n.ts._role._options.watermarkAvailable,
	},
} satisfies RolePolicyDef;

export type RolePolicyValueRecord = _RolePolicyValueRecord<typeof rolePolicyDef>;

export type RolePolicySettingsRecord = _RolePolicySettingsRecord<typeof rolePolicyDef>;

export type RolePolicyRecord = {
	[K in keyof typeof rolePolicyDef]: GetRolePolicyEditorValuesType<typeof rolePolicyDef[K]>;
};

type RolePolicyDefDef = typeof rolePolicyDef[keyof typeof rolePolicyDef];

export function getPolicyDisplayValue<D extends RolePolicyDefDef, T = GetRolePolicyEditorValuesType<D>>(
	policyDef: D,
	value: T,
	full = false,
): string {
	if ('displayValue' in policyDef && policyDef.displayValue != null) {
		if (typeof policyDef.displayValue === 'string') {
			return policyDef.displayValue;
		} else {
			return policyDef.displayValue(value as never, full);
		}
	}

	if (policyDef.type === 'enum') {
		const enumItem = policyDef.enum.find(item => item.value === value);
		if (enumItem) {
			return enumItem.label;
		} else {
			return value as string;
		}
	} else if (policyDef.type === 'boolean') {
		return value ? i18n.ts.yes : i18n.ts.no;
	} else if (typeof value === 'number') {
		return value.toString();
	} else if (typeof value === 'string') {
		return value;
	} else {
		return i18n.ts.unknown;
	}
}
