<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="ti ti-photo"></i> {{ i18n.ts._pages.blocks.image }}</template>
	<template #func>
		<button @click="choose()">
			<i class="ti ti-folder"></i>
		</button>
	</template>

	<section class="oyyftmcf">
		<MkDriveFileThumbnail v-if="file" class="preview" :file="file" fit="contain" @click="choose()"/>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { onMounted } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	modelValue: any
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: any): void;
}>();

let file: any = $ref(null);

async function choose() {
	os.selectDriveFile(false).then((fileResponse: any) => {
		file = fileResponse;
		emit('update:modelValue', {
			...props.modelValue,
			fileId: fileResponse.id,
		});
	});
}

onMounted(async () => {
	if (props.modelValue.fileId == null) {
		await choose();
	} else {
		os.api('drive/files/show', {
			fileId: props.modelValue.fileId,
		}).then(fileResponse => {
			file = fileResponse;
		});
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
