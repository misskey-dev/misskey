<template>
<div class="_formRoot">
	<FormLink to="/settings/plugin/install"><template #icon><i class="ti ti-download"></i></template>{{ i18n.ts._plugin.install }}</FormLink>

	<FormSection>
		<template #label>{{ i18n.ts.manage }}</template>
		<div v-for="plugin in plugins" :key="plugin.id" class="_formBlock _panel" style="padding: 20px;">
			<span style="display: flex;"><b>{{ plugin.name }}</b><span style="margin-left: auto;">v{{ plugin.version }}</span></span>

			<FormSwitch class="_formBlock" :model-value="plugin.active" @update:modelValue="changeActive(plugin, $event)">{{ i18n.ts.makeActive }}</FormSwitch>

			<MkKeyValue class="_formBlock">
				<template #key>{{ i18n.ts.author }}</template>
				<template #value>{{ plugin.author }}</template>
			</MkKeyValue>
			<MkKeyValue class="_formBlock">
				<template #key>{{ i18n.ts.description }}</template>
				<template #value>{{ plugin.description }}</template>
			</MkKeyValue>
			<MkKeyValue class="_formBlock">
				<template #key>{{ i18n.ts.permission }}</template>
				<template #value>{{ plugin.permission }}</template>
			</MkKeyValue>

			<div style="display: flex; gap: var(--margin); flex-wrap: wrap;">
				<MkButton v-if="plugin.config" inline @click="config(plugin)"><i class="ti ti-settings"></i> {{ i18n.ts.settings }}</MkButton>
				<MkButton inline danger @click="uninstall(plugin)"><i class="ti ti-trash"></i> {{ i18n.ts.uninstall }}</MkButton>
			</div>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue';
import FormLink from '@/components/form/link.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const plugins = ref(ColdDeviceStorage.get('plugins'));

function uninstall(plugin) {
	ColdDeviceStorage.set('plugins', plugins.value.filter(x => x.id !== plugin.id));
	os.success();
	nextTick(() => {
		unisonReload();
	});
}

// TODO: この処理をstore側にactionとして移動し、設定画面を開くAiScriptAPIを実装できるようにする
async function config(plugin) {
	const config = plugin.config;
	for (const key in plugin.configData) {
		config[key].default = plugin.configData[key];
	}

	const { canceled, result } = await os.form(plugin.name, config);
	if (canceled) return;

	const coldPlugins = ColdDeviceStorage.get('plugins');
	coldPlugins.find(p => p.id === plugin.id)!.configData = result;
	ColdDeviceStorage.set('plugins', coldPlugins);

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

<style lang="scss" scoped>

</style>
