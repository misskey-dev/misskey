<template>
<MkTextarea :value="text" readonly></MkTextarea>
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
