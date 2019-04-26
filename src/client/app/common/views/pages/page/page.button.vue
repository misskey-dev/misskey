<template>
<div class="">
	<ui-button @click="click()">{{ value.text }}</ui-button>
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
		root: {
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
			this.root.calcVariables();
			if (this.value.action === 'dialog') {
				this.$root.dialog({
					text: this.root.interpolate(this.value.props.content)
				});
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
</style>
