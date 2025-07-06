/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';
import XUploadableFileTypesCaption from './roles.policy-editor.uploadableFileTypesCaption.vue';
import type {
	RolePolicyEditorDef,
	GetRolePolicyEditorValuesType,
	RolePolicyValueRecord as _RolePolicyValueRecord,
	RolePolicySettingsRecord as _RolePolicySettingsRecord,
} from '@/types/role-policy-editor.js';

export const rolePolicyEditorDef = {
  rateLimitFactor: {
    type: 'range',
    folderLabel: i18n.ts._role._options.rateLimitFactor,
		folderSuffix: (value) => `${Math.round(value * 100)}%`,
    min: 0.3,
    max: 3,
    step: 0.1,
		textConverter: (value) => `${Math.round(value * 100)}%`,
		inputCaption: i18n.ts._role._options.descriptionOfRateLimitFactor,
  },
  gtlAvailable: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.gtlAvailable,
  },
  ltlAvailable: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.ltlAvailable,
  },
  canPublicNote: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canPublicNote,
  },
  chatAvailability: {
    type: 'enum',
    folderLabel: i18n.ts._role._options.chatAvailability,
		enum: [
			{ label: i18n.ts.enabled, value: 'available' },
			{ label: i18n.ts.readonly, value: 'readonly' },
			{ label: i18n.ts.disabled, value: 'unavailable' },
		],
  },
  mentionLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.mentionMax,
  },
  canInvite: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canInvite,
  },
  inviteLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.inviteLimit,
  },
  inviteLimitCycle: {
    type: 'number',
    folderLabel: i18n.ts._role._options.inviteLimitCycle,
		folderSuffix: (value) => `${value} ${i18n.ts._time.minute}`,
		inputSuffix: i18n.ts._time.minute,
  },
  inviteExpirationTime: {
    type: 'number',
    folderLabel: i18n.ts._role._options.inviteExpirationTime,
		folderSuffix: (value) => `${value} ${i18n.ts._time.minute}`,
		inputSuffix: i18n.ts._time.minute,
  },
  canManageAvatarDecorations: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canManageAvatarDecorations,
  },
  canManageCustomEmojis: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canManageCustomEmojis,
  },
  canSearchNotes: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canSearchNotes,
  },
  canUseTranslator: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canUseTranslator,
  },
  driveCapacityMb: {
    type: 'number',
    folderLabel: i18n.ts._role._options.driveCapacity,
		folderSuffix: (value) => `${value} MB`,
		inputSuffix: 'MB',
  },
  maxFileSizeMb: {
    type: 'number',
    folderLabel: i18n.ts._role._options.maxFileSize,
		folderSuffix: (value) => `${value} MB`,
		inputSuffix: 'MB',
  },
  uploadableFileTypes: {
    type: 'string',
		multiline: true,
    folderLabel: i18n.ts._role._options.uploadableFileTypes,
		folderSuffix: '...',
		inputCaption: XUploadableFileTypesCaption,
  },
  alwaysMarkNsfw: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.alwaysMarkNsfw,
  },
  canUpdateBioMedia: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canUpdateBioMedia,
  },
  pinLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.pinMax,
  },
  antennaLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.antennaMax,
  },
  wordMuteLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.wordMuteMax,
		inputSuffix: 'chars',
  },
  webhookLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.webhookMax,
  },
  clipLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.clipMax,
  },
  noteEachClipsLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.noteEachClipsMax,
  },
  userListLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.userListMax,
  },
  userEachUserListsLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.userEachUserListsMax,
  },
  canHideAds: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canHideAds,
  },
  avatarDecorationLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.avatarDecorationLimit,
		min: 0,
		max: 16,
  },
  canImportAntennas: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canImportAntennas,
  },
  canImportBlocking: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canImportBlocking,
  },
  canImportFollowing: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canImportFollowing,
  },
  canImportMuting: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canImportMuting,
  },
  canImportUserLists: {
    type: 'boolean',
    folderLabel: i18n.ts._role._options.canImportUserLists,
  },
  noteDraftLimit: {
    type: 'number',
    folderLabel: i18n.ts._role._options.noteDraftLimit,
		min: 0,
  },
} satisfies RolePolicyEditorDef;

export type RolePolicyValueRecord = _RolePolicyValueRecord<typeof rolePolicyEditorDef>;

export type RolePolicySettingsRecord = _RolePolicySettingsRecord<typeof rolePolicyEditorDef>;

export type RolePolicyRecord = {
	[K in keyof typeof rolePolicyEditorDef]: GetRolePolicyEditorValuesType<typeof rolePolicyEditorDef[K]>;
};
