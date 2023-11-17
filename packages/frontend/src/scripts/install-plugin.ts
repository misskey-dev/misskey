/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import { compareVersions } from 'compare-versions';
import { v4 as uuid } from 'uuid';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import type { Plugin } from '@/store.js';
import { ColdDeviceStorage } from '@/store.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { getPluginList } from '@/plugin.js';
import { toHash } from './xxhash.js';

export type AiScriptPluginMeta = {
	name: string;
	version: string;
	author: string;
	description?: string;
	permissions?: string[];
	config?: Record<string, any>;
	id?: string;
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
		fromAccount: false,
	} as Plugin));
}

async function savePluginToAccount(pluginOnlyOverride: boolean, { id, meta, src, token }: {
	id: string;
	meta: AiScriptPluginMeta;
	src: string;
	token: string;
}) {
	const plugins = await getPluginList();
	// pluginOnlyOverrideがtrueになっているということはすでに重複していることが確定している
	const configData = pluginOnlyOverride ? plugins[id].configData : {};
	const pluginToken = pluginOnlyOverride ? plugins[id].token : token;
	plugins[id] = {
		...meta,
		id,
		active: true,
		configData,
		token: pluginToken,
		src: src,
		fromAccount: true,
	} as Plugin;

	if (!pluginOnlyOverride) {
		await os.api('i/registry/remove-all-keys-in-scope', { scope: ['client', 'aiscript', 'plugins', id] });
	}

	await os.api('i/registry/set', { scope: ['client'], key: 'plugins', value: plugins });
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

	const { name, version, author, description, permissions, config, id } = metadata;
	if (name == null || version == null || author == null) {
		throw new Error('Required property not found');
	}

	if (id != null && !/^[a-zA-Z0-9_]+$/.test(id)) {
		throw new Error('Invalid id format.');
	}

	return {
		name,
		version,
		author,
		description,
		permissions,
		config,
		id,
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

	const plugins = Object.keys(await getPluginList());
	const pluginHash = await toHash(realMeta.name, realMeta.author);

	const { isLocal, pluginOnlyOverride } = await new Promise((res, rej) => {
		const pluginCheckId = realMeta.id ?? pluginHash;
		os.popup(defineAsyncComponent(() => import('@/components/MkPluginSelectSaveWindow.vue')), {
			isExistsFromAccount: plugins.some(v => v === pluginCheckId)
		}, {
			done: result => {
				res(result);
			},
		}, 'closed');
	});

	const token = realMeta.permissions == null || realMeta.permissions.length === 0 || pluginOnlyOverride ? null : await new Promise((res, rej) => {
		os.popup(defineAsyncComponent(() => import('@/components/MkTokenGenerateWindow.vue')), {
			title: i18n.ts.tokenRequested,
			information: i18n.ts.pluginTokenRequestedDescription,
			initialName: realMeta.name,
			initialPermissions: realMeta.permissions,
		}, {
			done: async result => {
				const { name, permissions } = result;
				const { token } = await os.api('miauth/gen-token', {
					session: null,
					name: name,
					permission: permissions,
				});
				res(token);
			},
		}, 'closed');
	});

	if (isLocal) {
		savePlugin({
			id: realMeta.id ?? uuid(),
			meta: realMeta,
			token,
			src: code,
		});
	} else {
		await savePluginToAccount(pluginOnlyOverride, {
			id: realMeta.id ?? pluginHash,
			meta: realMeta,
			token,
			src: code,
		});
	}
}
