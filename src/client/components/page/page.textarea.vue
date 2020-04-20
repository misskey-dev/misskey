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
		hpml: {
			required: true
		}
	},
	data() {
		return {
			text: this.hpml.interpolate(this.value.text),
		};
	},
	watch: {
		'hpml.vars': {
			handler() {
				this.text = this.hpml.interpolate(this.value.text);
			},
			deep: true
		}
	}
});
</script>
