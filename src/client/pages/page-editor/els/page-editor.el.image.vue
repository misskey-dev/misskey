<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faImage"/> {{ $t('_pages.blocks.image') }}</template>
	<template #func>
		<button @click="choose()">
			<fa :icon="faFolderOpen"/>
		</button>
	</template>

	<section class="oyyftmcf">
		<mk-file-thumbnail class="preview" v-if="file" :file="file" fit="contain" @click="choose()"/>
	</section>
</x-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faImage, faFolderOpen } from '@fortawesome/free-regular-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkFileThumbnail from '@/components/drive-file-thumbnail.vue';
import { selectDriveFile } from '@/scripts/select-drive-file';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkFileThumbnail
	},

	props: {
		value: {
			required: true
		},
	},

	data() {
		return {
			file: null,
			faPencilAlt, faImage, faFolderOpen
		};
	},

	created() {
		if (this.value.fileId === undefined) Vue.set(this.value, 'fileId', null);
	},

	mounted() {
		if (this.value.fileId == null) {
			this.choose();
		} else {
			os.api('drive/files/show', {
				fileId: this.value.fileId
			}).then(file => {
				this.file = file;
			});
		}
	},

	methods: {
		async choose() {
			selectDriveFile(this.$root, false).then(file => {
				this.file = file;
				this.value.fileId = file.id;
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.oyyftmcf {
	> .preview {
		height: 150px;
	}
}
</style>
