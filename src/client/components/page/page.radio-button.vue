<template>
<div>
	<div>{{ hpml.interpolate(value.title) }}</div>
	<MkRadio v-for="x in value.values" v-model="v" :value="x" :key="x">{{ x }}</MkRadio>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkRadio from '../ui/radio.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkRadio
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
