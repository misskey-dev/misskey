<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MediaImage
		v-if="image"
		:image="image"
		:disableImageLink="true"
	/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MediaImage from '@/components/MkMediaImage.vue';

const props = defineProps<{
	block: Misskey.entities.PageBlock,
	page: Misskey.entities.Page,
}>();

const image = ref<Misskey.entities.DriveFile | null>(null);

onMounted(() => {
	image.value = props.page.attachedFiles.find(x => x.id === props.block.fileId) ?? null;
});

</script>
