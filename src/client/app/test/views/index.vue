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
</main>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			mfm: '',
		};
	}
});
</script>

<style lang="stylus" scoped>
main
	max-width 700px
	margin 0 auto

</style>
