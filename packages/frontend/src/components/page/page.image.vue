<template>
<div>
	<ImgWithBlurhash v-if="image" style="max-width: 100%;" :hash="image.blurhash" :src="image.url" :alt="image.comment" :title="image.comment" :width="image.properties.width" :height="image.properties.height" :cover="false"/>
</div>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { ImageBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';

const props = defineProps<{
	block: PropType<ImageBlock>,
	hpml: PropType<Hpml>,
}>();

const image = props.hpml.page.attachedFiles.find(x => x.id === props.block.fileId);
</script>
