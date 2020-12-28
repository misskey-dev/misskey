<template>
<section class="_section">
	<div class="_title"><Fa :icon="faPlug"/> {{ $ts.plugins }}</div>
	<div class="_content">
		<details>
			<summary><Fa :icon="faDownload"/> {{ $ts.install }}</summary>
			<MkInfo warn>{{ $ts.pluginInstallWarn }}</MkInfo>
			<MkTextarea v-model:value="script" tall>
				<span>{{ $ts.script }}</span>
			</MkTextarea>
			<MkButton @click="install()" primary><Fa :icon="faSave"/> {{ $ts.install }}</MkButton>
		</details>
	</div>
	<div class="_content">
		<details>
			<summary><Fa :icon="faFolderOpen"/> {{ $ts.manage }}</summary>
			<MkSelect v-model:value="selectedPluginId">
				<option v-for="x in plugins" :value="x.id" :key="x.id">{{ x.name }}</option>
			</MkSelect>
			<template v-if="selectedPlugin">
				<div style="margin: -8px 0 8px 0;">
					<MkSwitch :value="selectedPlugin.active" @update:value="changeActive(selectedPlugin, $event)">{{ $ts.makeActive }}</MkSwitch>
				</div>
				<div class="_keyValue">
					<div>{{ $ts.version }}:</div>
					<div>{{ selectedPlugin.version }}</div>
				</div>
				<div class="_keyValue">
					<div>{{ $ts.author }}:</div>
					<div>{{ selectedPlugin.author }}</div>
				</div>
				<div class="_keyValue">
					<div>{{ $ts.description }}:</div>
					<div>{{ selectedPlugin.description }}</div>
				</div>
				<div style="margin-top: 8px;">
					<MkButton @click="config()" inline v-if="selectedPlugin.config"><Fa :icon="faCog"/> {{ $ts.settings }}</MkButton>
					<MkButton @click="uninstall()" inline><Fa :icon="faTrashAlt"/> {{ $ts.uninstall }}</MkButton>
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
import { ColdDeviceStorage } from '@/store';

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
			plugins: ColdDeviceStorage.get('plugins'),
			selectedPluginId: null,
			faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog
		}
	},

	computed: {
		selectedPlugin() {
			if (this.selectedPluginId == null) return null;
			return this.plugins.find(x => x.id === this.selectedPluginId);
		},
	},

	methods: {
		installPlugin({ id, meta, ast, token }) {
			ColdDeviceStorage.set('plugins', this.plugins.concat({
				...meta,
				id,
				active: true,
				configData: {},
				token: token,
				ast: ast
			}));
		},

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

			const token = permissions == null || permissions.length === 0 ? null : await new Promise((res, rej) => {
				os.popup(import('@/components/token-generate-window.vue'), {
					title: this.$ts.tokenRequested,
					information: this.$ts.pluginTokenRequestedDescription,
					initialName: name,
					initialPermissions: permissions
				}, {
					done: async result => {
						const { name, permissions } = result;
						const { token } = await os.api('miauth/gen-token', {
							session: null,
							name: name,
							permission: permissions,
						});

						res(token);
					}
				}, 'closed');
			});

			this.installPlugin({
				id: uuid(),
				meta: {
					name, version, author, description, permissions, config
				},
				token,
				ast: serialize(ast)
			});

			os.success();

			this.$nextTick(() => {
				location.reload();
			});
		},

		uninstall() {
			ColdDeviceStorage.set('plugins', this.plugins.filter(x => x.id !== this.selectedPluginId));
			os.success();
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

			const plugins = ColdDeviceStorage.get('plugins');
			plugins.find(p => p.id === this.selectedPluginId).configData = result;
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
