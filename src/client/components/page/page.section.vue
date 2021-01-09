<template>
<section class="sdgxphyu">
	<component :is="'h' + h">{{ block.title }}</component>

	<div class="children">
		<XBlock v-for="child in block.children" :block="child" :hpml="hpml" :key="child.id" :h="h + 1"/>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, PropType } from 'vue';
import * as os from '@/os';
import { SectionBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';

export default defineComponent({
	components: {
		XBlock: defineAsyncComponent(() => import('./page.block.vue'))
	},
	props: {
		block: {
			type: Object as PropType<SectionBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		},
		h: {
			required: true
		}
	},
});
</script>

<style lang="scss" scoped>
.sdgxphyu {
	margin: 1.5em 0;

	> h2 {
		font-size: 1.35em;
		margin: 0 0 0.5em 0;
	}

	> h3 {
		font-size: 1em;
		margin: 0 0 0.5em 0;
	}

	> h4 {
		font-size: 1em;
		margin: 0 0 0.5em 0;
	}

	> .children {
		//padding 16px
	}
}
</style>
