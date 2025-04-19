/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';
import { miLocalStorage } from '@/local-storage.js';
import { unisonReload } from '@/utility/unison-reload.js';
import { claimAchievement } from '@/utility/achievements.js';

export async function changeYamiMode(ev: MouseEvent) {
	// 「今後表示しない」の設定を確認
	const neverShowEnterYamiModeInfo = miLocalStorage.getItem('neverShowEnterYamiModeInfo');
	if ($i && !$i.isInYamiMode) {
		// 表示しないが設定されていない場合はダイアログを表示
		if (neverShowEnterYamiModeInfo !== 'true') {
			const confirm = await os.actions({
				type: 'warning',
				title: i18n.ts._yami.switchMode,
				text: i18n.ts._yami._yamiModeSwitcher.enterYamiModeConfirm,
				actions: [
					{
						value: 'yes' as const,
						text: i18n.ts.ok,
						primary: true,
					},
					{
						value: 'neverShow' as const,
						text: `${i18n.ts.ok} (${i18n.ts.neverShow})`,
						danger: true,
					},
					{
						value: 'cancel' as const,
						text: i18n.ts.cancel,
					},
				],
			});

			if (confirm.canceled || confirm.result === 'cancel') return;

			if (confirm.result === 'neverShow') {
				miLocalStorage.setItem('neverShowEnterYamiModeInfo', 'true');
			}
		}

		os.apiWithDialog('i/update', {
			isInYamiMode: true,
		}).then(() => {
			unisonReload();
			// やみモードに入った実績を解除
			claimAchievement('markedAsYamiModeUser');
		});
	}
	ev.currentTarget ?? ev.target;
}

export async function changeNormalMode(ev: MouseEvent) {
	// 「今後表示しない」の設定を確認
	const neverShowExitYamiModeInfo = miLocalStorage.getItem('neverShowExitYamiModeInfo');
	if ($i && $i.isInYamiMode) {
		// 表示しないが設定されていない場合はダイアログを表示
		if (neverShowExitYamiModeInfo !== 'true') {
			const confirm = await os.actions({
				type: 'warning',
				title: i18n.ts._yami.switchMode,
				text: i18n.ts._yami._yamiModeSwitcher.exitYamiModeConfirm,
				actions: [
					{
						value: 'yes' as const,
						text: i18n.ts.ok,
						primary: true,
					},
					{
						value: 'neverShow' as const,
						text: `${i18n.ts.ok} (${i18n.ts.neverShow})`,
						danger: true,
					},
					{
						value: 'cancel' as const,
						text: i18n.ts.cancel,
					},
				],
			});

			if (confirm.canceled || confirm.result === 'cancel') return;

			if (confirm.result === 'neverShow') {
				miLocalStorage.setItem('neverShowExitYamiModeInfo', 'true');
			}
		}

		os.apiWithDialog('i/update', {
			isInYamiMode: false,
		}).then(() => {
			unisonReload();
		});
	}
	ev.currentTarget ?? ev.target;
}
