<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { ImageBlock } from './block.type.js';
import MediaImage from '@/components/MkMediaImage.vue';

const props = defineProps<{
	block: ImageBlock,
	page: Misskey.entities.Page,
}>();

const image = ref<Misskey.entities.DriveFile>(props.page.attachedFiles.find(x => x.id === props.block.fileId));
</script>
