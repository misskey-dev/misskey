<template>
<component :is="'x-' + value.type" :value="value" @input="v => updateItem(v)" @remove="() => $emit('remove', value)" :key="value.id" :ai-script="aiScript"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XSection from './els/page-editor.el.section.vue';
import XText from './els/page-editor.el.text.vue';
import XTextarea from './els/page-editor.el.textarea.vue';
import XImage from './els/page-editor.el.image.vue';
import XButton from './els/page-editor.el.button.vue';
import XTextInput from './els/page-editor.el.text-input.vue';
import XTextareaInput from './els/page-editor.el.textarea-input.vue';
import XNumberInput from './els/page-editor.el.text-input.vue';
import XSwitch from './els/page-editor.el.switch.vue';
import XIf from './els/page-editor.el.if.vue';
import XPost from './els/page-editor.el.post.vue';

export default Vue.extend({
	components: {
		XSection, XText, XImage, XButton, XTextarea, XTextInput, XTextareaInput, XNumberInput, XSwitch, XIf, XPost
	},

	props: {
		value: {
			required: true
		},
		aiScript: {
			required: true,
		},
	},
});
</script>
