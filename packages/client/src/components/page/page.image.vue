<template>
<div class="lzyxtsnt">
	<img v-if="image" :src="image.url"/>
</div>
</template>

<script lang="ts" setup>
import { defineComponent, PropType } from 'vue';
import * as os from '@/os';
import { ImageBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';

const props = defineProps({
	block: {
		type: Object as PropType<ImageBlock>,
		required: true
	},
	hpml: {
		type: Object as PropType<Hpml>,
		required: true
	}
});

const image = props.hpml.page.attachedFiles.find(x => x.id === props.block.fileId);
</script>

<style lang="scss" scoped>
.lzyxtsnt {
	> img {
		max-width: 100%;
	}
}
</style>
