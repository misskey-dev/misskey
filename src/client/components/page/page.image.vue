<template>
<div class="lzyxtsnt">
	<img v-if="image" :src="image.url"/>
</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import * as os from '@/os';
import { ImageBlock } from '@/scripts/hpml/block';

export default defineComponent({
	props: {
		block: {
			type: Object as PropType<ImageBlock>,
			required: true
		},
		page: {
			type: Object as PropType<Record<string, any>>,
			required: true
		}
	},
	setup(props, ctx) {
		const image = props.page.attachedFiles.find(x => x.id === props.block.fileId);

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
