<template>
<div class="hkcxmtwj">
	<mk-switch v-model="v">{{ script.interpolate(value.text) }}</mk-switch>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkSwitch from '../ui/switch.vue';

export default Vue.extend({
	components: {
		MkSwitch
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
			v: this.value.default,
		};
	},
	watch: {
		v() {
			this.script.aoiScript.updatePageVar(this.value.name, this.v);
			this.script.eval();
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
