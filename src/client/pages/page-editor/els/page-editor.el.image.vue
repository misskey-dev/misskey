<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><i class="fas fa-image"></i> {{ $ts._pages.blocks.image }}</template>
	<template #func>
		<button @click="choose()">
			<i class="fas fa-folder-open"></i>
		</button>
	</template>

	<section class="oyyftmcf">
		<MkDriveFileThumbnail class="preview" v-if="file" :file="file" fit="contain" @click="choose()"/>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faImage, faFolderOpen } from '@fortawesome/free-regular-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkDriveFileThumbnail from '@client/components/drive-file-thumbnail.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		XContainer, MkDriveFileThumbnail
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
		if (this.value.fileId === undefined) this.value.fileId = null;
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
			os.selectDriveFile(false).then(file => {
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
