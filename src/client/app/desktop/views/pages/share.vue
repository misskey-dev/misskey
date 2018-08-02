<template>
<div class="pptjhabgjtt7kwskbfv4y3uml6fpuhmr">
	<h1>%i18n:@share-with-left%%i18n:common.name%%i18n:@share-with-right%</h1>
	<div>
		<mk-signin v-if="!$store.getters.isSignedIn"/>
		<mk-post-form v-else-if="!posted" :initial-text="text" :instant="true" @posted="posted = true"/>
		<p v-if="posted" class="posted">%fa:check%</p>
	</div>
	<button v-if="posted" class="ui button" @click="close">%i18n:@close%</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			posted: false,
			text: new URLSearchParams(location.search).get('text')
		};
	},
	methods: {
		close() {
			window.close();
		}
	}
});
</script>

<style lang="stylus" scoped>
.pptjhabgjtt7kwskbfv4y3uml6fpuhmr
	padding 16px

	> h1
		margin 0 0 8px 0
		color #555
		font-size 20px
		text-align center

	> div
		max-width 500px
		margin 0 auto
		background #fff
		border solid 1px rgba(#000, 0.1)
		border-radius 6px
		overflow hidden

		> .posted
			display block
			margin 0
			padding 64px
			text-align center

	> button
		display block
		margin 16px auto
</style>
