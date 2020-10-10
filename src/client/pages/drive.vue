<template>
<div>
	<div style="padding: 16px;">
		<XDrive ref="drive" @cd="x => folder = x"/>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faCloud, faFolderPlus, faUpload, faLink, faICursor, faTrashAlt, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import XDrive from '@/components/drive.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XDrive
	},

	data() {
		return {
			info: {
				header: [{
					title: computed(() => this.folder ? this.folder.name : this.$t('drive')),
					icon: faCloud,
				}],
				action: {
					icon: faEllipsisH,
					handler: this.menu
				}
			},
			menuOpened: false,
			folder: null,
		};
	},

	methods: {
		menu(ev) {
			this.menuOpened = true;
			os.menu({
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
			}, {
				source: ev.currentTarget || ev.target,
			}).then(() => {
				this.menuOpened = false;
			});
		}
	}
});
</script>
