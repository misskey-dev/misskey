<template>
<mk-window ref="window" is-modal width="800px" height="500px" @closed="destroyDom">
	<span slot="header">
		<span v-html="title" :class="$style.title"></span>
	</span>

	<mk-drive
		ref="browser"
		:class="$style.browser"
		:multiple="false"
	/>
	<div :class="$style.footer">
		<button :class="$style.cancel" @click="cancel">%i18n:@cancel%</button>
		<button :class="$style.ok" @click="ok">%i18n:@ok%</button>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		title: {
			default: '%fa:R folder%%i18n:@choose-prompt%'
		}
	},
	methods: {
		ok() {
			this.$emit('selected', (this.$refs.browser as any).folder);
			(this.$refs.window as any).close();
		},
		cancel() {
			(this.$refs.window as any).close();
		}
	}
});
</script>

<style lang="stylus" module>


.title
	> [data-fa]
		margin-right 4px

.browser
	height calc(100% - 72px)

.footer
	height 72px
	background var(--primaryLighten95)

.ok
.cancel
	display block
	position absolute
	bottom 16px
	cursor pointer
	padding 0
	margin 0
	width 120px
	height 40px
	font-size 1em
	outline none
	border-radius 4px

	&:focus
		&:after
			content ""
			pointer-events none
			position absolute
			top -5px
			right -5px
			bottom -5px
			left -5px
			border 2px solid var(--primaryAlpha03)
			border-radius 8px

	&:disabled
		opacity 0.7
		cursor default

.ok
	right 16px
	color var(--primaryForeground)
	background linear-gradient(to bottom, var(--primaryLighten25) 0%, var(--primaryLighten10) 100%)
	border solid 1px var(--primaryLighten15)

	&:not(:disabled)
		font-weight bold

	&:hover:not(:disabled)
		background linear-gradient(to bottom, var(--primaryLighten8) 0%, var(--primaryDarken8) 100%)
		border-color var(--primary)

	&:active:not(:disabled)
		background var(--primary)
		border-color var(--primary)

.cancel
	right 148px
	color #888
	background linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)
	border solid 1px #e2e2e2

	&:hover
		background linear-gradient(to bottom, #f9f9f9 0%, #ececec 100%)
		border-color #dcdcdc

	&:active
		background #ececec
		border-color #dcdcdc

</style>
