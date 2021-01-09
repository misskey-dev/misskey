<template>
<div class="lzyxtsnt">
	<img v-if="image" :src="image.url"/>
</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import * as os from '@/os';
import { ImageBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';

export default defineComponent({
	props: {
		block: {
			type: Object as PropType<ImageBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		}
	},
	setup(props, ctx) {
		const image = props.hpml.page.attachedFiles.find(x => x.id === props.block.fileId);

		return {
			image
		};
	}
});
</script>

<style lang="scss" scoped>
.lzyxtsnt {
	> img {
		max-width: 100%;
	}
}
</style>
