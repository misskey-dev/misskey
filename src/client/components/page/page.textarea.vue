<template>
<x-textarea :value="text" readonly></x-textarea>
</template>

<script lang="ts">
import Vue from 'vue';
import XTextarea from '../ui/textarea.vue';

export default Vue.extend({
	components: {
		XTextarea
	},
	props: {
		value: {
			required: true
		},
		script: {
			required: true
		}
	},
	data() {
		return {
			text: this.script.interpolate(this.value.text),
		};
	},
	watch: {
		'script.vars': {
			handler() {
				this.text = this.script.interpolate(this.value.text);
			},
			deep: true
		}
	}
});
</script>
