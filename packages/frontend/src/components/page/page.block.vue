<template>
<component :is="'x-' + block.type" :key="block.id" :block="block" :hpml="hpml" :h="h"/>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import XText from './page.text.vue';
import XSection from './page.section.vue';
import XImage from './page.image.vue';
import XNote from './page.note.vue';
import { Hpml } from '@/scripts/hpml/evaluator';
import { Block } from '@/scripts/hpml/block';

export default defineComponent({
	components: {
		XText, XSection, XImage, XNote,
	},
	props: {
		block: {
			type: Object as PropType<Block>,
			required: true,
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true,
		},
		h: {
			type: Number,
			required: true,
		},
	},
});
</script>
