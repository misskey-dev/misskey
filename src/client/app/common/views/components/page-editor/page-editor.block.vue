<template>
<component :is="'x-' + value.type" :value="value" @input="v => updateItem(v)" @remove="() => $emit('remove', value)" :key="value.id"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XSection from './page-editor.section.vue';
import XText from './page-editor.text.vue';
import XImage from './page-editor.image.vue';
import XButton from './page-editor.button.vue';
import XInput from './page-editor.input.vue';
import XSwitch from './page-editor.switch.vue';

export default Vue.extend({
	components: {
		XSection, XText, XImage, XButton, XInput, XSwitch
	},

	props: {
		value: {
			required: true
		}
	},
});
</script>
