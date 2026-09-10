/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedFederationInstanceSchema = v.object({
	id: mi.idString(),
	firstRetrievedAt: mi.dateTimeString(),
	host: mi.example(v.string(), 'misskey.example.com'),
	usersCount: v.number(),
	notesCount: v.number(),
	followingCount: v.number(),
	followersCount: v.number(),
	isNotResponding: v.boolean(),
	isSuspended: v.boolean(),
	suspensionState: v.picklist(['none', 'manuallySuspended', 'goneSuspended', 'autoSuspendedForNotResponding', 'softwareSuspended']),
	isBlocked: v.boolean(),
	softwareName: mi.example(v.nullable(v.string()), 'misskey'),
	softwareVersion: v.nullable(v.string()),
	openRegistrations: mi.example(v.nullable(v.boolean()), true),
	name: v.nullable(v.string()),
	description: v.nullable(v.string()),
	maintainerName: v.nullable(v.string()),
	maintainerEmail: v.nullable(v.string()),
	isSilenced: v.boolean(),
	isMediaSilenced: v.boolean(),
	iconUrl: v.nullable(mi.urlString()),
	faviconUrl: v.nullable(mi.urlString()),
	themeColor: v.nullable(v.string()),
	infoUpdatedAt: v.nullable(mi.dateTimeString()),
	latestRequestReceivedAt: v.nullable(mi.dateTimeString()),
	moderationNote: v.optional(v.nullable(v.string())),
});
mi.defineEntity('FederationInstance', packedFederationInstanceSchema);

export type PackedFederationInstance = v.InferOutput<typeof packedFederationInstanceSchema>;
