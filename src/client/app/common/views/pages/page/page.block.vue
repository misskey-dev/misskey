<template>
<component :is="'x-' + value.type" :value="value" :page="page" :script="script" :key="value.id" :h="h"/>
</template>

<script lang="ts">
import Vue from 'vue';
import XText from './page.text.vue';
import XSection from './page.section.vue';
import XImage from './page.image.vue';
import XButton from './page.button.vue';
import XInput from './page.input.vue';
import XSwitch from './page.switch.vue';
import XIf from './page.if.vue';

export default Vue.extend({
	components: {
		XText, XSection, XImage, XButton, XInput, XSwitch, XIf
	},

	props: {
		value: {
			required: true
		},
		script: {
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
