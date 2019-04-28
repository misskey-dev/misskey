<template>
<div>
	<ui-button class="kudkigyw" @click="click()">{{ value.text }}</ui-button>
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
			faStickyNote, faPlus, faPencilAlt
		};
	},

	methods: {
		click() {
			if (this.value.action === 'dialog') {
				this.script.reEval();
				this.$root.dialog({
					text: this.script.interpolate(this.value.content)
				});
			} else if (this.value.action === 'resetRandom') {
				this.script.aiScript.updateRandomSeed(Math.random());
				this.script.reEval();
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
