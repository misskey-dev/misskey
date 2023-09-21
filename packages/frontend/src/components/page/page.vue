<template>
<div v-if="hpml" class="iroscrza" :class="{ center: page.alignCenter, serif: page.font === 'serif' }">
	<XBlock v-for="child in page.content" :key="child.id" :block="child" :hpml="hpml" :h="2"/>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, nextTick, PropType } from 'vue';
import XBlock from './page.block.vue';
import { Hpml } from '@/scripts/hpml/evaluator';
import { url } from '@/config';
import { $i } from '@/account';

export default defineComponent({
	components: {
		XBlock,
	},
	props: {
		page: {
			type: Object as PropType<Record<string, any>>,
			required: true,
		},
	},
	setup(props, ctx) {
		const hpml = new Hpml(props.page, {
			randomSeed: Math.random(),
			visitor: $i,
			url: url,
		});

		onMounted(() => {
			nextTick(() => {
				hpml.eval();
			});
		});

		return {
			hpml,
		};
	},
});
</script>

<style lang="scss" scoped>
.iroscrza {
	&.serif {
		> div {
			font-family: serif;
		}
	}

	&.center {
		text-align: center;
	}
}
</style>
