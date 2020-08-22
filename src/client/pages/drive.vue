<template>
<div class="full">
	<teleport to="#_teleport_header">
		<button @click="menu" class="_button _jmoebdiw_">
			<fa :icon="faCloud" style="margin-right: 8px;"/>
			<span v-if="folder">{{ $t('drive') }} ({{ folder.name }})</span>
			<span v-else>{{ $t('drive') }}</span>
			<fa :icon="menuOpened ? faAngleUp : faAngleDown" style="margin-left: 8px;"/>
		</button>
	</teleport>
	<x-drive ref="drive" @cd="x => folder = x"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCloud, faAngleDown, faAngleUp, faFolderPlus, faUpload, faLink, faICursor, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import XDrive from '../components/drive.vue';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('drive') as string
		};
	},

	components: {
		XDrive
	},

	data() {
		return {
			menuOpened: false,
			folder: null,
			faCloud, faAngleDown, faAngleUp
		};
	},

	methods: {
		menu(ev) {
			this.menuOpened = true;
			this.$root.menu({
				items: [{
					text: this.$t('addFile'),
					type: 'label'
				}, {
					text: this.$t('upload'),
					icon: faUpload,
					action: () => { this.$refs.drive.selectLocalFile(); }
				}, {
					text: this.$t('fromUrl'),
					icon: faLink,
					action: () => { this.$refs.drive.urlUpload(); }
				}, null, {
					text: this.folder ? this.folder.name : this.$t('drive'),
					type: 'label'
				}, this.folder ? {
					text: this.$t('renameFolder'),
					icon: faICursor,
					action: () => { this.$refs.drive.renameFolder(this.folder); }
				} : undefined, this.folder ? {
					text: this.$t('deleteFolder'),
					icon: faTrashAlt,
					action: () => { this.$refs.drive.deleteFolder(this.folder); }
				} : undefined, {
					text: this.$t('createFolder'),
					icon: faFolderPlus,
					action: () => { this.$refs.drive.createFolder(); }
				}],
				fixed: true,
				noCenter: true,
				source: ev.currentTarget || ev.target
			}).then(() => {
				this.menuOpened = false;
			});
		}
	}
});
</script>

<style lang="scss">
._jmoebdiw_ {
	height: 100%;
	padding: 0 16px;
	font-weight: bold;
}
</style>
