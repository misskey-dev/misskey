/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';

export type SystemWebhookEventType = Misskey.entities.SystemWebhook['on'][number];

export type MkSystemWebhookEditorProps = {
	mode: 'create' | 'edit';
	id?: string;
	requiredEvents?: SystemWebhookEventType[];
};

export type MkSystemWebhookResult = {
	id?: string;
	isActive: boolean;
	name: string;
	on: SystemWebhookEventType[];
	url: string;
	secret: string;
};

export async function showSystemWebhookEditorDialog(props: MkSystemWebhookEditorProps): Promise<MkSystemWebhookResult | null> {
	const { result } = await new Promise<{ result: MkSystemWebhookResult | null }>(async resolve => {
		const { dispose } = os.popup(
			defineAsyncComponent(() => import('@/components/MkSystemWebhookEditor.vue')),
			props,
			{
				submitted: (ev: MkSystemWebhookResult) => {
					resolve({ result: ev });
				},
				canceled: () => {
					resolve({ result: null });
				},
				closed: () => {
					dispose();
				},
			},
		);
	});

	return result;
}
