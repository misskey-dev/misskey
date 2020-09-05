<template>
<div>
	<mk-textarea v-model:value="v">{{ hpml.interpolate(value.text) }}</mk-textarea>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkTextarea from '../ui/textarea.vue';

export default defineComponent({
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
