/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { compareVersions } from 'compare-versions';
import { v4 as uuid } from 'uuid';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import type { Plugin } from '@/store.js';
import { ColdDeviceStorage } from '@/store.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';

export type AiScriptPluginMeta = {
	name: string;
	version: string;
	author: string;
	description?: string;
	permissions?: string[];
	config?: Record<string, any>;
};

const parser = new Parser();

export function savePlugin({ id, meta, src, token }: {
	id: string;
	meta: AiScriptPluginMeta;
	src: string;
	token: string;
}) {
	ColdDeviceStorage.set('plugins', ColdDeviceStorage.get('plugins').concat({
		...meta,
		id,
		active: true,
		configData: {},
		token: token,
		src: src,
	} as Plugin));
}

export function isSupportedAiScriptVersion(version: string): boolean {
	try {
		return (compareVersions(version, '0.12.0') >= 0);
	} catch (err) {
		return false;
	}
}

export async function parsePluginMeta(code: string): Promise<AiScriptPluginMeta> {
	if (!code) {
		throw new Error('code is required');
	}

	const lv = utils.getLangVersion(code);
	if (lv == null) {
		throw new Error('No language version annotation found');
	} else if (!isSupportedAiScriptVersion(lv)) {
		throw new Error(`Aiscript version '${lv}' is not supported`);
	}

	let ast;
	try {
		ast = parser.parse(code);
	} catch (err) {
		throw new Error('Aiscript syntax error');
	}

	const meta = Interpreter.collectMetadata(ast);
	if (meta == null) {
		throw new Error('Meta block not found');
	}

	const metadata = meta.get(null);
	if (metadata == null) {
		throw new Error('Metadata not found');
	}

	const { name, version, author, description, permissions, config } = metadata;
	if (name == null || version == null || author == null) {
		throw new Error('Required property not found');
	}

	return {
		name,
		version,
		author,
		description,
		permissions,
		config,
	};
}

export async function installPlugin(code: string, meta?: AiScriptPluginMeta) {
	if (!code) return;

	let realMeta: AiScriptPluginMeta;
	if (!meta) {
		realMeta = await parsePluginMeta(code);
	} else {
		realMeta = meta;
	}

	const token = realMeta.permissions == null || realMeta.permissions.length === 0 ? null : await new Promise((res, rej) => {
		os.popup(defineAsyncComponent(() => import('@/components/MkTokenGenerateWindow.vue')), {
			title: i18n.ts.tokenRequested,
			information: i18n.ts.pluginTokenRequestedDescription,
			initialName: realMeta.name,
			initialPermissions: realMeta.permissions,
		}, {
			done: async result => {
				const { name, permissions } = result;
				const { token } = await misskeyApi('miauth/gen-token', {
					session: null,
					name: name,
					permission: permissions,
				});
				res(token);
			},
		}, 'closed');
	});

	savePlugin({
		id: uuid(),
		meta: realMeta,
		token,
		src: code,
	});
}
