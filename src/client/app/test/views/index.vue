<template>
<main>
	<ui-card>
		<div slot="title">MFM Playground</div>
		<section class="fit-top">
			<ui-textarea v-model="mfm">
				<span>MFM</span>
			</ui-textarea>
			<div>
				<misskey-flavored-markdown :text="mfm" :i="$store.state.i"/>
			</div>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">Dialog Generator</div>
		<section class="fit-top">
			<ui-select v-model="dialogType" placeholder="">
				<option value="info">Info</option>
				<option value="success">Success</option>
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

	methods: {
		showDialog() {
			this.$root.alert({
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
