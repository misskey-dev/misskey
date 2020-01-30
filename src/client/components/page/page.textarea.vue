<template>
<mk-textarea :value="text" readonly></mk-textarea>
</template>

<script lang="ts">
import Vue from 'vue';
import MkTextarea from '../ui/textarea.vue';

export default Vue.extend({
	components: {
		MkTextarea
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
