<template>
<FormBase>
	<FormGroup v-for="plugin in plugins" :key="plugin.id">
		<template #label><span style="display: flex;"><b>{{ plugin.name }}</b><span style="margin-left: auto;">v{{ plugin.version }}</span></span></template>

		<FormSwitch :value="plugin.active" @update:modelValue="changeActive(plugin, $event)">{{ $ts.makeActive }}</FormSwitch>
		<div class="_debobigegoItem">
			<div class="_debobigegoPanel" style="padding: 16px;">
				<div class="_keyValue">
					<div>{{ $ts.author }}:</div>
					<div>{{ plugin.author }}</div>
				</div>
				<div class="_keyValue">
					<div>{{ $ts.description }}:</div>
					<div>{{ plugin.description }}</div>
				</div>
				<div class="_keyValue">
					<div>{{ $ts.permission }}:</div>
					<div>{{ plugin.permissions }}</div>
				</div>
			</div>
		</div>
		<div class="_debobigegoItem">
			<div class="_debobigegoPanel" style="padding: 16px;">
				<MkButton @click="config(plugin)" inline v-if="plugin.config"><i class="fas fa-cog"></i> {{ $ts.settings }}</MkButton>
				<MkButton @click="uninstall(plugin)" inline danger><i class="fas fa-trash-alt"></i> {{ $ts.uninstall }}</MkButton>
			</div>
		</div>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkSelect from '@/components/form/select.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkTextarea,
		MkSelect,
		FormSwitch,
		FormBase,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts._plugin.manage,
				icon: 'fas fa-plug',
				bg: 'var(--bg)',
			},
			plugins: ColdDeviceStorage.get('plugins'),
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
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
