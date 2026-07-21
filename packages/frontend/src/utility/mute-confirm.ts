/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import * as os from '@/os.js';
import type { MkMuteSettingDialogDoneEvent } from '@/components/MkMuteSettingDialog.vue';

export function openMuteSettingDialog(opts?: { withMuteType?: boolean }): Promise<MkMuteSettingDialogDoneEvent> {
	return new Promise(resolve => {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkMuteSettingDialog.vue')), opts ?? {}, {
			done: result => {
				resolve(result ? result : { canceled: true });
			},
			closed: () => {
				dispose();
			 },
		});
	});
}
