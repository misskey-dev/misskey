<template>
<component :is="'x-' + value.type" :value="value" @input="v => updateItem(v)" @remove="() => $emit('remove', value)" :key="value.id" :ai-script="aiScript"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XSection from './els/page-editor.el.section.vue';
import XText from './els/page-editor.el.text.vue';
import XImage from './els/page-editor.el.image.vue';
import XButton from './els/page-editor.el.button.vue';
import XInput from './els/page-editor.el.input.vue';
import XSwitch from './els/page-editor.el.switch.vue';
import XIf from './els/page-editor.el.if.vue';

export default Vue.extend({
	components: {
		XSection, XText, XImage, XButton, XInput, XSwitch, XIf
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
