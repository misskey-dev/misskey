<template>
<div>
	<MkInput class="kudkigyw" v-model:value="v" type="text">{{ hpml.interpolate(value.text) }}</MkInput>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkInput from '../ui/input.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkInput
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

<style lang="scss" scoped>
.kudkigyw {
	display: inline-block;
	min-width: 300px;
	max-width: 450px;
	margin: 8px 0;
}
</style>
