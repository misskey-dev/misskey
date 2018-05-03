<template>
<div class="mk-connect-failed">
	<img src="data:image/jpeg;base64,%base64:/assets/error.jpg%" alt=""/>
	<h1>%i18n:@title%</h1>
	<p class="text">
		<span>{{ '%i18n:!@description%'.substr(0, '%i18n:!@description%'.indexOf('{')) }}</span>
		<a @click="reload">{{ '%i18n:!@description%'.match(/\{(.+?)\}/)[1] }}</a>
		<span>{{ '%i18n:!@description%'.substr('%i18n:!@description%'.indexOf('}') + 1) }}</span>
	</p>
	<button v-if="!troubleshooting" @click="troubleshooting = true">%i18n:@troubleshoot%</button>
	<x-troubleshooter v-if="troubleshooting"/>
	<p class="thanks">%i18n:@thanks%</p>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XTroubleshooter from './connect-failed.troubleshooter.vue';

export default Vue.extend({
	components: {
		XTroubleshooter
	},
	data() {
		return {
			troubleshooting: false
		};
	},
	mounted() {
		document.title = 'Oops!';
		document.documentElement.style.background = '#f8f8f8';
	},
	methods: {
		reload() {
			location.reload(true);
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-connect-failed
	width 100%
	padding 32px 18px
	text-align center

	> img
		display block
		height 200px
		margin 0 auto
		pointer-events none
		user-select none

	> h1
		display block
		margin 1.25em auto 0.65em auto
		font-size 1.5em
		color #555

	> .text
		display block
		margin 0 auto
		max-width 600px
		font-size 1em
		color #666

	> button
		display block
		margin 1em auto 0 auto
		padding 8px 10px
		color $theme-color-foreground
		background $theme-color

		&:focus
			outline solid 3px rgba($theme-color, 0.3)

		&:hover
			background lighten($theme-color, 10%)

		&:active
			background darken($theme-color, 10%)

	> .thanks
		display block
		margin 2em auto 0 auto
		padding 2em 0 0 0
		max-width 600px
		font-size 0.9em
		font-style oblique
		color #aaa
		border-top solid 1px #eee

	@media (max-width 500px)
		padding 24px 18px
		font-size 80%

		> img
			height 150px

</style>

