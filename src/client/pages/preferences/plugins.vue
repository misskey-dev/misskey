<template>
<section class="_card">
	<div class="_title"><fa :icon="faPlug"/> {{ $t('plugins') }}</div>
	<div class="_content">
		<details>
			<summary><fa :icon="faDownload"/> {{ $t('install') }}</summary>
			<mk-info warn>{{ $t('pluginInstallWarn') }}</mk-info>
			<mk-textarea v-model="script" tall>
				<span v-t="'script'"></span>
			</mk-textarea>
			<mk-button @click="install()" primary><fa :icon="faSave"/> {{ $t('install') }}</mk-button>
		</details>
	</div>
	<div class="_content">
		<details>
			<summary><fa :icon="faFolderOpen"/> {{ $t('manage') }}</summary>
			<mk-select v-model="selectedPluginId">
				<option v-for="x in $store.state.deviceUser.plugins" :value="x.id" :key="x.id">{{ x.name }}</option>
			</mk-select>
			<template v-if="selectedPlugin">
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
					<mk-button @click="config()" inline v-if="selectedPlugin.config"><fa :icon="faCog"/> {{ $t('settings') }}</mk-button>
					<mk-button @click="uninstall()" inline><fa :icon="faTrashAlt"/> {{ $t('uninstall') }}</mk-button>
				</div>
			</template>
		</details>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { AiScript, parse } from '@syuilo/aiscript';
import { serialize } from '@syuilo/aiscript/built/serializer';
import { faPlug, faSave, faTrashAlt, faFolderOpen, faDownload, faCog } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkSelect from '../../components/ui/select.vue';
import MkInfo from '../../components/ui/info.vue';

export default Vue.extend({
	components: {
		MkButton,
		MkTextarea,
		MkSelect,
		MkInfo,
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
				this.$root.dialog({
					type: 'error',
					text: 'Syntax error :('
				});
				return;
			}
			const meta = AiScript.collectMetadata(ast);
			if (meta == null) {
				this.$root.dialog({
					type: 'error',
					text: 'No metadata found :('
				});
				return;
			}
			const data = meta.get(null);
			if (data == null) {
				this.$root.dialog({
					type: 'error',
					text: 'No metadata found :('
				});
				return;
			}
			const { id, name, version, author, description, permissions, config } = data;
			if (id == null || name == null || version == null || author == null) {
				this.$root.dialog({
					type: 'error',
					text: 'Required property not found :('
				});
				return;
			}

			const token = permissions == null || permissions.length === 0 ? null : await new Promise(async (res, rej) => {
				this.$root.new(await import('../../components/token-generate-window.vue').then(m => m.default), {
					title: this.$t('tokenRequested'),
					information: this.$t('pluginTokenRequestedDescription'),
					initialName: name,
					initialPermissions: permissions
				}).$on('ok', async ({ name, permissions }) => {
					const { token } = await this.$root.api('miauth/gen-token', {
						session: null,
						name: name,
						permission: permissions,
					});

					res(token);
				});
			});

			this.$store.commit('deviceUser/installPlugin', {
				meta: {
					id, name, version, author, description, permissions, config
				},
				token,
				ast: serialize(ast)
			});

			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});

			this.$nextTick(() => {
				location.reload();
			});
		},

		uninstall() {
			this.$store.commit('deviceUser/uninstallPlugin', this.selectedPluginId);
			this.$root.dialog({
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

			const { canceled, result } = await this.$root.form(this.selectedPlugin.name, config);
			if (canceled) return;

			this.$store.commit('deviceUser/configPlugin', {
				id: this.selectedPluginId,
				config: result
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
