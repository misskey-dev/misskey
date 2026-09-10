/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';

export const packedQueueCountSchema = v.object({
	waiting: v.number(),
	active: v.number(),
	completed: v.number(),
	failed: v.number(),
	delayed: v.number(),
});
mi.defineEntity('QueueCount', packedQueueCountSchema);

export type PackedQueueCount = v.InferOutput<typeof packedQueueCountSchema>;

// Bull.Metrics
export const packedQueueMetricsSchema = v.object({
	meta: v.object({
		count: v.number(),
		prevTS: v.number(),
		prevCount: v.number(),
	}),
	data: v.array(v.number()),
	count: v.number(),
});
mi.defineEntity('QueueMetrics', packedQueueMetricsSchema);

export type PackedQueueMetrics = v.InferOutput<typeof packedQueueMetricsSchema>;

export const packedQueueJobSchema = v.object({
	id: v.string(),
	name: v.string(),
	// json-schema 側も properties 無しの object で無検証だったため mi.anyObject() を維持 (cookbook R1)
	data: mi.anyObject(),
	opts: mi.anyObject(),
	timestamp: v.number(),
	processedOn: v.optional(v.number()),
	processedBy: v.optional(v.string()),
	finishedOn: v.optional(v.number()),
	/**
	 * NOTE: legacy の型は `{ type: 'object' }` (properties 無し) から `any` に潰れており、
	 * 唯一の生成元である QueueService.packJobData が bullmq の
	 * `JobProgress` (= `string | boolean | number | object`) をそのまま代入している。
	 * `mi.anyObject()` (= `Record<string, any>`) に狭めると代入できなくなるので、
	 * 型は legacy と同じ `any` のまま api.json 出力だけを `{ type: 'object' }` に合わせる。
	 */
	progress: v.pipe(v.any(), mi.openApi({ type: 'object' })),
	attempts: v.number(),
	delay: v.number(),
	failedReason: v.string(),
	stacktrace: v.array(v.string()),
	returnValue: mi.anyObject(),
	isFailed: v.boolean(),
});
mi.defineEntity('QueueJob', packedQueueJobSchema);

export type PackedQueueJob = v.InferOutput<typeof packedQueueJobSchema>;
