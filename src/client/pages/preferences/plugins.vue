<template>
<section class="_card">
	<div class="_title"><fa :icon="faPlug"/> {{ $t('plugins') }}</div>
	<div class="_content">
		<details>
			<summary><fa :icon="faDownload"/> {{ $t('install') }}</summary>
			<mk-info warn>{{ $t('pluginInstallWarn') }}</mk-info>
			<mk-textarea v-model="script" tall>
				<span>{{ $t('script') }}</span>
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
				<mk-button @click="uninstall()" style="margin-top: 8px;"><fa :icon="faTrashAlt"/> {{ $t('uninstall') }}</mk-button>
			</template>
		</details>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlug, faSave, faTrashAlt, faFolderOpen, faDownload } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkSelect from '../../components/ui/select.vue';
import MkInfo from '../../components/ui/info.vue';
import { AiScript, parse } from '@syuilo/aiscript';

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
			faPlug, faSave, faTrashAlt, faFolderOpen, faDownload
		}
	},

	computed: {
		selectedPlugin() {
			if (this.selectedPluginId == null) return null;
			return this.$store.state.deviceUser.plugins.find(x => x.id === this.selectedPluginId);
		},
	},

	methods: {
		install() {
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
			console.log(meta);
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
			const { id, name, version, author, description } = data;
			if (id == null || name == null || version == null || author == null) {
				this.$root.dialog({
					type: 'error',
					text: 'Required property not found :('
				});
				return;
			}
			this.$store.commit('deviceUser/installPlugin', {
				meta: {
					id, name, version, author, description
				},
				ast
			});
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},

		uninstall() {
			this.$store.commit('deviceUser/uninstallPlugin', this.selectedPluginId);
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		}
	},
});
</script>

<style lang="scss" scoped>

</style>
