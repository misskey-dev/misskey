<template>
<div class="hkcxmtwj">
	<mk-switch v-model="v">{{ hpml.interpolate(value.text) }}</mk-switch>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkSwitch from '../ui/switch.vue';

export default defineComponent({
	components: {
		MkSwitch
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
.hkcxmtwj {
	display: inline-block;
	margin: 16px auto;

	& + .hkcxmtwj {
		margin-left: 16px;
	}
}
</style>
