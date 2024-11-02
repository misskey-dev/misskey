/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { initInstance, instance } from '@/instance.js';

export async function getDefaultStoreOverrides() {
	await initInstance();
	if (instance.defaultClientSettingOverrides != null) {
		try {
			const clientSettingOverrides = JSON.parse(instance.defaultClientSettingOverrides);
			const out = Object.fromEntries(Object.keys(clientSettingOverrides).filter(key => key.startsWith('defaultStore::')).map(key => [key.split('::')[1], clientSettingOverrides[key]]));
			return out;
		} catch (err) {
			return null;
		}
	}
	return null;
}

export function getColdDeviceStorageOverrides() {
	if (instance.defaultClientSettingOverrides != null) {
		try {
			const clientSettingOverrides = JSON.parse(instance.defaultClientSettingOverrides);
			const out = Object.fromEntries(Object.keys(clientSettingOverrides).filter(key => key.startsWith('ColdDeviceStorage::')).map(key => [key.split('::')[1], clientSettingOverrides[key]]));
			return out;
		} catch (err) {
			return null;
		}
	}
	return null;
}
