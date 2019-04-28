<template>
<div>
	<ui-input class="kudkigyw" v-model="v" :type="value.inputType">{{ value.text }}</ui-input>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
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
			faStickyNote, faPlus, faPencilAlt
		};
	},

	watch: {
		v() {
			this.script.aiScript.updatePageVar(this.value.name, this.v);
			this.script.reEval();
		}
	}
});
</script>

<style lang="stylus" scoped>
.kudkigyw
	display inline-block
	min-width 300px
	max-width 450px
	margin 8px 0
</style>
