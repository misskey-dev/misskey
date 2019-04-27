<template>
<span class="kudkigyw">
	<ui-button @click="click()">{{ value.text }}</ui-button>
</span>
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
			faStickyNote, faPlus, faPencilAlt
		};
	},

	methods: {
		click() {
			this.script.reEval();
			if (this.value.action === 'dialog') {
				this.$root.dialog({
					text: this.script.interpolate(this.value.props.content)
				});
			}
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
