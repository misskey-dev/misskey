<template>
<component :is="'x-' + value.type" :value="value" :page="page" :hpml="hpml" :key="value.id" :h="h"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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

export default defineComponent({
	components: {
		XText, XSection, XImage, XButton, XNumberInput, XTextInput, XTextareaInput, XTextarea, XPost, XSwitch, XIf, XCounter, XRadioButton, XCanvas
	},
	props: {
		value: {
			required: true
		},
		hpml: {
			required: true
		},
		page: {
			required: true
		},
		h: {
			required: true
		}
	},
});
</script>
