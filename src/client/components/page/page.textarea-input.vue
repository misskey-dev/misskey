<template>
<div>
	<mk-textarea v-model="v">{{ hpml.interpolate(value.text) }}</mk-textarea>
</div>
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
			v: this.value.default,
		};
	},
	watch: {
		v() {
			this.hpml.updatePageVar(this.value.name, this.v);
			this.hpml.eval();
		}
	}
});
</script>
