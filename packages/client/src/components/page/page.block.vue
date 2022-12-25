<template>
<component :is="'x-' + block.type" :key="block.id" :block="block" :hpml="hpml" :h="h"/>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import XText from './page.text.vue';
import XSection from './page.section.vue';
import XImage from './page.image.vue';
import XButton from './page.button.vue';
import XNumberInput from './page.number-input.vue';
import XTextInput from './page.text-input.vue';
import XTextareaInput from './page.textarea-input.vue';
import XSwitch from './page.switch.vue';
import XIf from './page.if.vue';
import XTextarea from './page.textarea.vue';
import XPost from './page.post.vue';
import XCounter from './page.counter.vue';
import XRadioButton from './page.radio-button.vue';
import XCanvas from './page.canvas.vue';
import XNote from './page.note.vue';
import { Hpml } from '@/scripts/hpml/evaluator';
import { Block } from '@/scripts/hpml/block';

export default defineComponent({
	components: {
		XText, XSection, XImage, XButton, XNumberInput, XTextInput, XTextareaInput, XTextarea, XPost, XSwitch, XIf, XCounter, XRadioButton, XCanvas, XNote,
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
