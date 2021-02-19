<template>
<FormBase>
	<FormGroup v-for="plugin in plugins" :key="plugin.id">
		<template #label><span style="display: flex;"><b>{{ plugin.name }}</b><span style="margin-left: auto;">v{{ plugin.version }}</span></span></template>

		<FormSwitch :value="plugin.active" @update:value="changeActive(plugin, $event)">{{ $ts.makeActive }}</FormSwitch>
		<div class="_formItem">
			<div class="_formPanel" style="padding: 16px;">
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
		<div class="_formItem">
			<div class="_formPanel" style="padding: 16px;">
				<MkButton @click="config(plugin)" inline v-if="plugin.config"><Fa :icon="faCog"/> {{ $ts.settings }}</MkButton>
				<MkButton @click="uninstall(plugin)" inline danger><Fa :icon="faTrashAlt"/> {{ $ts.uninstall }}</MkButton>
			</div>
		</div>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkSelect from '@/components/ui/select.vue';
import MkInfo from '@/components/ui/info.vue';
import FormSwitch from '@/components/form/switch.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';

export default defineComponent({
	components: {
		MkButton,
		MkTextarea,
		MkSelect,
		MkInfo,
		FormSwitch,
		FormBase,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$ts._plugin.manage,
				icon: faPlug
			},
			plugins: ColdDeviceStorage.get('plugins'),
			faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
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
