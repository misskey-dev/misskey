<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faImage"/> {{ $t('blocks.image') }}</template>
	<template #func>
		<button @click="choose()">
			<fa :icon="faFolderOpen"/>
		</button>
	</template>

	<section class="oyyftmcf">
		<x-file-thumbnail class="preview" v-if="file" :file="file" :detail="true" fit="contain" @click="choose()"/>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faImage, faFolderOpen } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../../../../i18n';
import XContainer from '../page-editor.container.vue';
import XFileThumbnail from '../../../components/drive-file-thumbnail.vue';

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XContainer, XFileThumbnail
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
			this.$root.api('drive/files/show', {
				fileId: this.value.fileId
			}).then(file => {
				this.file = file;
			});
		}
	},

	methods: {
		async choose() {
			this.$chooseDriveFile({
				multiple: false
			}).then(file => {
				this.file = file;
				this.value.fileId = file.id;
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.oyyftmcf
	> .preview
		height 150px

</style>
