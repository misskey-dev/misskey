<template>
<main>
	<ui-card>
		<template #title>MFM Playground</template>
		<section class="fit-top">
			<ui-textarea v-model="mfm">
				<span>MFM</span>
			</ui-textarea>
		</section>
		<section>
			<header>Preview</header>
			<mfm :text="mfm" :i="$store.state.i"/>
		</section>
		<section>
			<header style="margin-bottom:0;">AST</header>
			<ui-textarea v-model="mfmAst" readonly tall style="margin-top:16px;"></ui-textarea>
		</section>
	</ui-card>

	<ui-card>
		<template #title>Dialog Generator</template>
		<section class="fit-top">
			<ui-select v-model="dialogType" placeholder="">
				<option value="info">Information</option>
				<option value="success">Success</option>
				<option value="warning">Warning</option>
				<option value="error">Error</option>
			</ui-select>
			<ui-input v-model="dialogTitle">
				<span>Title</span>
			</ui-input>
			<ui-input v-model="dialogText">
				<span>Text</span>
			</ui-input>
			<ui-switch v-model="dialogShowCancelButton">With cancel button</ui-switch>
			<ui-button @click="showDialog">Show</ui-button>
		</section>
	</ui-card>
</main>
</template>

<script lang="ts">
import Vue from 'vue';
import { parse } from '../../../../mfm/parse';
import * as JSON5 from 'json5';

export default Vue.extend({
	data() {
		return {
			mfm: '',
			dialogType: 'success',
			dialogTitle: '',
			dialogText: 'Hello World!',
			dialogShowCancelButton: false
		};
	},

	computed: {
		mfmAst(): any {
			return JSON5.stringify(parse(this.mfm), null, 2);
		}
	},

	methods: {
		showDialog() {
			this.$root.dialog({
				type: this.dialogType,
				title: this.dialogTitle,
				text: this.dialogText,
				showCancelButton: this.dialogShowCancelButton
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	max-width 700px
	margin 0 auto

</style>
