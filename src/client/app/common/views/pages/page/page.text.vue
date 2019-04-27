<template>
<div class="">
	<mfm :text="text" :is-note="false" :i="$store.state.i"/>
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
			text: this.script.interpolate(this.value.text),
			faStickyNote, faPlus, faPencilAlt
		};
	},
});
</script>

<style lang="stylus" scoped>
</style>
