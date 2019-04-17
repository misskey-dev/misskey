<template>
<mk-ui>
	<template #header>
		<template v-if="folder"><span style="margin-right:4px;"><fa :icon="['far', 'folder-open']"/></span>{{ folder.name }}</template>
		<template v-if="file"><mk-file-type-icon data-icon :type="file.type" style="margin-right:4px;"/>{{ file.name }}</template>
		<template v-if="!folder && !file"><span style="margin-right:4px;"><fa icon="cloud"/></span>{{ $t('@.drive') }}</template>
	</template>
	<template #func v-if="folder || (!folder && !file)"><button @click="openContextMenu" ref="contextSource"><fa icon="ellipsis-h"/></button></template>
	<x-drive
		ref="browser"
		:init-folder="initFolder"
		:init-file="initFile"
		:is-naked="true"
		:top="$store.state.uiHeaderHeight"
		@begin-fetch="Progress.start()"
		@fetched-mid="Progress.set(0.5)"
		@fetched="Progress.done()"
		@move-root="onMoveRoot"
		@open-folder="onOpenFolder"
		@open-file="onOpenFile"
	/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';
import XMenu from '../../../common/views/components/menu.vue';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/drive.vue'),
	components: {
		XDrive: () => import('../components/drive.vue').then(m => m.default),
	},
	data() {
		return {
			Progress,
			folder: null,
			file: null,
			initFolder: null,
			initFile: null
		};
	},
	created() {
		this.initFolder = this.$route.params.folder;
		this.initFile = this.$route.params.file;

		window.addEventListener('popstate', this.onPopState);
	},
	mounted() {
		document.title = `${this.$root.instanceName} Drive`;
	},
	beforeDestroy() {
		window.removeEventListener('popstate', this.onPopState);
	},
	methods: {
		onPopState() {
			if (this.$route.params.folder) {
				(this.$refs as any).browser.cd(this.$route.params.folder, true);
			} else if (this.$route.params.file) {
				(this.$refs as any).browser.cf(this.$route.params.file, true);
			} else {
				(this.$refs as any).browser.goRoot(true);
			}
		},
		onMoveRoot(silent) {
			const title = `${this.$root.instanceName} Drive`;

			if (!silent) {
				// Rewrite URL
				history.pushState(null, title, '/i/drive');
			}

			document.title = title;

			this.file = null;
			this.folder = null;
		},
		onOpenFolder(folder, silent) {
			const title = `${folder.name} | ${this.$root.instanceName} Drive`;

			if (!silent) {
				// Rewrite URL
				history.pushState(null, title, `/i/drive/folder/${folder.id}`);
			}

			document.title = title;

			this.file = null;
			this.folder = folder;
		},
		onOpenFile(file, silent) {
			const title = `${file.name} | ${this.$root.instanceName} Drive`;

			if (!silent) {
				// Rewrite URL
				history.pushState(null, title, `/i/drive/file/${file.id}`);
			}

			document.title = title;

			this.file = file;
			this.folder = null;
		},
		openContextMenu() {
			this.$root.new(XMenu, {
				items: [{
					type: 'item',
					text: this.$t('contextmenu.upload'),
					icon: 'upload',
					action: this.$refs.browser.selectLocalFile
				}, {
					type: 'item',
					text: this.$t('contextmenu.url-upload'),
					icon: faCloudUploadAlt,
					action: this.$refs.browser.urlUpload
				}, {
					type: 'item',
					text: this.$t('contextmenu.create-folder'),
					icon: ['far', 'folder'],
					action: this.$refs.browser.createFolder
				}, ...(this.folder ? [{
					type: 'item',
					text: this.$t('contextmenu.rename-folder'),
					icon: 'i-cursor',
					action: this.$refs.browser.renameFolder
				}, {
					type: 'item',
					text: this.$t('contextmenu.move-folder'),
					icon: ['far', 'folder-open'],
					action: this.$refs.browser.moveFolder
				}, {
					type: 'item',
					text: this.$t('contextmenu.delete-folder'),
					icon: faTrashAlt,
					action: this.$refs.browser.deleteFolder
				}] : [])],
				source: this.$refs.contextSource,
			});
		}
	}
});
</script>

