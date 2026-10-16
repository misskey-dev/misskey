/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { path as configYamlPath } from '../../built/config.js';
import * as yaml from 'js-yaml';
import fs from "node:fs";

export function isConcurrentIndexMigrationEnabled() {
	return process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';
}

let loadedConfigCache = undefined;

function loadConfigInternal() {
	const config = yaml.load(fs.readFileSync(configYamlPath, 'utf-8'));

	return {
		disallowExternalApRedirect: Boolean(config.disallowExternalApRedirect ?? false),
		proxyRemoteFiles: Boolean(config.proxyRemoteFiles ?? false),
		signToActivityPubGet: Boolean(config.signToActivityPubGet ?? true),
	}
}

export function loadConfig() {
	if (loadedConfigCache === undefined) {
		loadedConfigCache = loadConfigInternal();
	}
	return loadedConfigCache;
}
