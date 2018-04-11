<template>
<mk-window ref="window" is-modal width="800px" height="500px" @closed="$destroy">
	<span slot="header">
		<span v-html="title" :class="$style.title"></span>
	</span>

	<mk-drive
		ref="browser"
		:class="$style.browser"
		:multiple="false"
	/>
	<div :class="$style.footer">
		<button :class="$style.cancel" @click="cancel">キャンセル</button>
		<button :class="$style.ok" @click="ok">決定</button>
	</div>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		title: {
			default: '%fa:R folder%フォルダを選択'
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
@import '~const.styl'

.title
	> [data-fa]
		margin-right 4px

.browser
	height calc(100% - 72px)

.footer
	height 72px
	background lighten($theme-color, 95%)

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
			border 2px solid rgba($theme-color, 0.3)
			border-radius 8px

	&:disabled
		opacity 0.7
		cursor default

.ok
	right 16px
	color $theme-color-foreground
	background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
	border solid 1px lighten($theme-color, 15%)

	&:not(:disabled)
		font-weight bold

	&:hover:not(:disabled)
		background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
		border-color $theme-color

	&:active:not(:disabled)
		background $theme-color
		border-color $theme-color

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
