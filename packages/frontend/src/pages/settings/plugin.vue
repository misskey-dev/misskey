<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormLink to="/settings/plugin/install"><template #icon><i class="ti ti-download"></i></template>{{ i18n.ts._plugin.install }}</FormLink>

	<FormSection>
		<template #label>{{ i18n.ts.manage }}</template>
		<div class="_gaps_s">
			<div v-for="plugin in plugins" :key="plugin.id" class="_panel _gaps_m" style="padding: 20px;">
				<div class="_gaps_s">
					<span style="display: flex; align-items: center;"><b>{{ plugin.name }}</b><span v-if="plugin.fromAccount" :class="$style.fromAccount">{{ '同期' }}</span><span style="margin-left: auto;">v{{ plugin.version }}</span></span>
					<MkSwitch :modelValue="plugin.active" @update:modelValue="changeActive(plugin, $event)">{{ i18n.ts.makeActive }}</MkSwitch>
				</div>

				<div class="_gaps_s">
					<MkKeyValue>
						<template #key>{{ i18n.ts.author }}</template>
						<template #value>{{ plugin.author }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ i18n.ts.description }}</template>
						<template #value>{{ plugin.description }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ i18n.ts.permission }}</template>
						<template #value>
							<ul style="margin-top: 0; margin-bottom: 0;">
								<li v-for="permission in plugin.permissions" :key="permission">{{ i18n.ts._permissions[permission] }}</li>
								<li v-if="!plugin.permissions || plugin.permissions.length === 0">{{ i18n.ts.none }}</li>
							</ul>
						</template>
					</MkKeyValue>
				</div>

				<div class="_buttons">
					<MkButton v-if="plugin.config" inline @click="config(plugin)"><i class="ti ti-settings"></i> {{ i18n.ts.settings }}</MkButton>
					<MkButton v-if="!plugin.fromAccount" inline @click="moveToAccount(plugin)"><i class="ti ti-link"></i> {{ i18n.ts.movePluginToAccount }}</MkButton>
					<MkButton inline danger @click="uninstall(plugin)"><i class="ti ti-trash"></i> {{ i18n.ts.uninstall }}</MkButton>
				</div>

				<MkFolder>
					<template #icon><i class="ti ti-code"></i></template>
					<template #label>{{ i18n.ts._plugin.viewSource }}</template>

					<div class="_gaps_s">
						<div class="_buttons">
							<MkButton inline @click="copy(plugin)"><i class="ti ti-copy"></i> {{ i18n.ts.copy }}</MkButton>
						</div>

						<MkCode :code="plugin.src ?? ''" lang="is"/>
					</div>
				</MkFolder>
			</div>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue';
import FormLink from '@/components/form/link.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkCode from '@/components/MkCode.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import { ColdDeviceStorage } from '@/store.js';
import { unisonReload } from '@/scripts/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { getPluginList } from '@/plugin.js';
import { toHash } from '@/scripts/xxhash.js';
import { savePluginToAccount } from '@/scripts/install-plugin.js';

let plugins = Object.values(await getPluginList());
plugins.push(...ColdDeviceStorage.get('plugins'));
plugins = ref(plugins);

async function uninstall(plugin) {
	if (plugin.fromAccount) {
		let plugins = await getPluginList();
		delete plugins[plugin.id];
		await os.api('i/registry/remove-all-keys-in-scope', { scope: ['client', 'aiscript', 'plugins', plugin.id] });
		await os.api('i/registry/set', { scope: ['client'], key: 'plugins', value: plugins });
	} else {
		const coldPlugins = ColdDeviceStorage.get('plugins');
		ColdDeviceStorage.set('plugins', coldPlugins.filter(x => x.id !== plugin.id));
	}
	await os.apiWithDialog('i/revoke-token', {
		token: plugin.token,
	});
	nextTick(() => {
		unisonReload();
	});
}

async function moveToAccount(plugin) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.movePluginToAccountConfirm,
	});

	if (canceled) return;

	const hash = await toHash(plugin.name, plugin.author);
	const plugins = await getPluginList();
	if (Object.keys(plugins).some(v => v === hash)) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts.overridePluginConfirm,
		});

		if (canceled) return;

		await os.api('i/registry/remove-all-keys-in-scope', { scope: ['client', 'aiscript', 'plugins', hash] });
	}

	const coldPlugins = ColdDeviceStorage.get('plugins');
	ColdDeviceStorage.set('plugins', coldPlugins.filter(x => x.id !== plugin.id));

	plugin.id = hash;
	plugin.fromAccount = true;
	plugins[hash] = plugin;

	await os.api('i/registry/set', { scope: ['client'], key: 'plugins', value: plugins });
}

function copy(plugin) {
	copyToClipboard(plugin.src ?? '');
	os.success();
}

// TODO: この処理をstore側にactionとして移動し、設定画面を開くAiScriptAPIを実装できるようにする
async function config(plugin) {
	const config = plugin.config;
	for (const key in plugin.configData) {
		config[key].default = plugin.configData[key];
	}

	const { canceled, result } = await os.form(plugin.name, config);
	if (canceled) return;

	if (plugin.fromAccount) {
		let plugins = await getPluginList();
		plugins[plugin.id].configData = result;
		await os.api('i/registry/set', { scope: ['client'], key: 'plugins', value: plugins });
	} else {
		const coldPlugins = ColdDeviceStorage.get('plugins');
		coldPlugins.find(p => p.id === plugin.id)!.configData = result;
		ColdDeviceStorage.set('plugins', coldPlugins);
	}

	nextTick(() => {
		location.reload();
	});
}

function changeActive(plugin, active) {
	const coldPlugins = ColdDeviceStorage.get('plugins');
	coldPlugins.find(p => p.id === plugin.id)!.active = active;
	ColdDeviceStorage.set('plugins', coldPlugins);

	nextTick(() => {
		location.reload();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.plugins,
	icon: 'ti ti-plug',
});
</script>

<style lang="scss" module>
	.fromAccount {
		margin-left: 0.7em;
		font-size: 65%;
		padding: 2px 3px;
		color: var(--accent);
		border: solid 1px var(--accent);
		border-radius: 4px;
		vertical-align: top;
	}
</style>
