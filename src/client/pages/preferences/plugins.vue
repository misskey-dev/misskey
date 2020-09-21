<template>
<section class="_card">
	<div class="_title"><Fa :icon="faPlug"/> {{ $t('plugins') }}</div>
	<div class="_content">
		<details>
			<summary><Fa :icon="faDownload"/> {{ $t('install') }}</summary>
			<MkInfo warn>{{ $t('pluginInstallWarn') }}</MkInfo>
			<MkTextarea v-model:value="script" tall>
				<span>{{ $t('script') }}</span>
			</MkTextarea>
			<MkButton @click="install()" primary><Fa :icon="faSave"/> {{ $t('install') }}</MkButton>
		</details>
	</div>
	<div class="_content">
		<details>
			<summary><Fa :icon="faFolderOpen"/> {{ $t('manage') }}</summary>
			<MkSelect v-model:value="selectedPluginId">
				<option v-for="x in $store.state.deviceUser.plugins" :value="x.id" :key="x.id">{{ x.name }}</option>
			</MkSelect>
			<template v-if="selectedPlugin">
				<div style="margin: -8px 0 8px 0;">
					<MkSwitch :value="selectedPlugin.active" @update:value="changeActive(selectedPlugin, $event)">{{ $t('makeActive') }}</MkSwitch>
				</div>
				<div class="_keyValue">
					<div>{{ $t('version') }}:</div>
					<div>{{ selectedPlugin.version }}</div>
				</div>
				<div class="_keyValue">
					<div>{{ $t('author') }}:</div>
					<div>{{ selectedPlugin.author }}</div>
				</div>
				<div class="_keyValue">
					<div>{{ $t('description') }}:</div>
					<div>{{ selectedPlugin.description }}</div>
				</div>
				<div style="margin-top: 8px;">
					<MkButton @click="config()" inline v-if="selectedPlugin.config"><Fa :icon="faCog"/> {{ $t('settings') }}</MkButton>
					<MkButton @click="uninstall()" inline><Fa :icon="faTrashAlt"/> {{ $t('uninstall') }}</MkButton>
				</div>
			</template>
		</details>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { AiScript, parse } from '@syuilo/aiscript';
import { serialize } from '@syuilo/aiscript/built/serializer';
import { v4 as uuid } from 'uuid';
import { faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkSelect from '@/components/ui/select.vue';
import MkInfo from '@/components/ui/info.vue';
import MkSwitch from '@/components/ui/switch.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		MkTextarea,
		MkSelect,
		MkInfo,
		MkSwitch,
	},
	
	data() {
		return {
			script: '',
			selectedPluginId: null,
			faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog
		}
	},

	computed: {
		selectedPlugin() {
			if (this.selectedPluginId == null) return null;
			return this.$store.state.deviceUser.plugins.find(x => x.id === this.selectedPluginId);
		},
	},

	methods: {
		async install() {
			let ast;
			try {
				ast = parse(this.script);
			} catch (e) {
				os.dialog({
					type: 'error',
					text: 'Syntax error :('
				});
				return;
			}
			const meta = AiScript.collectMetadata(ast);
			if (meta == null) {
				os.dialog({
					type: 'error',
					text: 'No metadata found :('
				});
				return;
			}
			const data = meta.get(null);
			if (data == null) {
				os.dialog({
					type: 'error',
					text: 'No metadata found :('
				});
				return;
			}
			const { name, version, author, description, permissions, config } = data;
			if (name == null || version == null || author == null) {
				os.dialog({
					type: 'error',
					text: 'Required property not found :('
				});
				return;
			}

			const token = permissions == null || permissions.length === 0 ? null : await new Promise(async (res, rej) => {
				os.modal(await import('@/components/token-generate-window.vue'), {
					title: this.$t('tokenRequested'),
					information: this.$t('pluginTokenRequestedDescription'),
					initialName: name,
					initialPermissions: permissions
				}).then(async result => {
					if (result == null) return;
					const { name, permissions } = result;
					const { token } = await os.api('miauth/gen-token', {
						session: null,
						name: name,
						permission: permissions,
					});

					res(token);
				});
			});

			this.$store.commit('deviceUser/installPlugin', {
				id: uuid(),
				meta: {
					name, version, author, description, permissions, config
				},
				token,
				ast: serialize(ast)
			});

			os.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});

			this.$nextTick(() => {
				location.reload();
			});
		},

		uninstall() {
			this.$store.commit('deviceUser/uninstallPlugin', this.selectedPluginId);
			os.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
			this.$nextTick(() => {
				location.reload();
			});
		},

		// TODO: この処理をstore側にactionとして移動し、設定画面を開くAiScriptAPIを実装できるようにする
		async config() {
			const config = this.selectedPlugin.config;
			for (const key in this.selectedPlugin.configData) {
				config[key].default = this.selectedPlugin.configData[key];
			}

			const { canceled, result } = await os.form(this.selectedPlugin.name, config);
			if (canceled) return;

			this.$store.commit('deviceUser/configPlugin', {
				id: this.selectedPluginId,
				config: result
			});

			this.$nextTick(() => {
				location.reload();
			});
		},

		changeActive(plugin, active) {
			this.$store.commit('deviceUser/changePluginActive', {
				id: plugin.id,
				active: active
			});

			this.$nextTick(() => {
				location.reload();
			});
		}
	},
});
</script>

<style lang="scss" scoped>

</style>
