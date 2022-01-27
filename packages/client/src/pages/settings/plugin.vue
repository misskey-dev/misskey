<template>
<div class="_formRoot">
	<FormLink to="/settings/plugin/install"><template #icon><i class="fas fa-download"></i></template>{{ $ts._plugin.install }}</FormLink>

	<FormSection>
		<template #label>{{ $ts.manage }}</template>
		<div v-for="plugin in plugins" :key="plugin.id" class="_formBlock _panel" style="padding: 20px;">
			<span style="display: flex;"><b>{{ plugin.name }}</b><span style="margin-left: auto;">v{{ plugin.version }}</span></span>

			<FormSwitch class="_formBlock" :modelValue="plugin.active" @update:modelValue="changeActive(plugin, $event)">{{ $ts.makeActive }}</FormSwitch>

			<MkKeyValue class="_formBlock">
				<template #key>{{ $ts.author }}</template>
				<template #value>{{ plugin.author }}</template>
			</MkKeyValue>
			<MkKeyValue class="_formBlock">
				<template #key>{{ $ts.description }}</template>
				<template #value>{{ plugin.description }}</template>
			</MkKeyValue>
			<MkKeyValue class="_formBlock">
				<template #key>{{ $ts.permission }}</template>
				<template #value>{{ plugin.permission }}</template>
			</MkKeyValue>

			<div style="display: flex; gap: var(--margin); flex-wrap: wrap;">
				<MkButton v-if="plugin.config" inline @click="config(plugin)"><i class="fas fa-cog"></i> {{ $ts.settings }}</MkButton>
				<MkButton inline danger @click="uninstall(plugin)"><i class="fas fa-trash-alt"></i> {{ $ts.uninstall }}</MkButton>
			</div>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormLink from '@/components/form/link.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/ui/button.vue';
import MkKeyValue from '@/components/key-value.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormLink,
		FormSwitch,
		FormSection,
		MkButton,
		MkKeyValue,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.plugins,
				icon: 'fas fa-plug',
				bg: 'var(--bg)',
			},
			plugins: ColdDeviceStorage.get('plugins'),
		}
	},

	methods: {
		uninstall(plugin) {
			ColdDeviceStorage.set('plugins', this.plugins.filter(x => x.id !== plugin.id));
			os.success();
			this.$nextTick(() => {
				unisonReload();
			});
		},

		// TODO: この処理をstore側にactionとして移動し、設定画面を開くAiScriptAPIを実装できるようにする
		async config(plugin) {
			const config = plugin.config;
			for (const key in plugin.configData) {
				config[key].default = plugin.configData[key];
			}

			const { canceled, result } = await os.form(plugin.name, config);
			if (canceled) return;

			const plugins = ColdDeviceStorage.get('plugins');
			plugins.find(p => p.id === plugin.id).configData = result;
			ColdDeviceStorage.set('plugins', plugins);

			this.$nextTick(() => {
				location.reload();
			});
		},

		changeActive(plugin, active) {
			const plugins = ColdDeviceStorage.get('plugins');
			plugins.find(p => p.id === plugin.id).active = active;
			ColdDeviceStorage.set('plugins', plugins);

			this.$nextTick(() => {
				location.reload();
			});
		}
	},
});
</script>

<style lang="scss" scoped>

</style>
