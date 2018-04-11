<template>
<div class="mkp-selectdrive">
	<mk-drive ref="browser"
		:multiple="multiple"
		@selected="onSelected"
		@change-selection="onChangeSelection"
	/>
	<footer>
		<button class="upload" title="%i18n:desktop.tags.mk-selectdrive-page.upload%" @click="upload">%fa:upload%</button>
		<button class="cancel" @click="close">%i18n:desktop.tags.mk-selectdrive-page.cancel%</button>
		<button class="ok" @click="ok">%i18n:desktop.tags.mk-selectdrive-page.ok%</button>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			files: []
		};
	},
	computed: {
		multiple(): boolean {
			const q = (new URL(location.toString())).searchParams;
			return q.get('multiple') == 'true';
		}
	},
	mounted() {
		document.title = '%i18n:desktop.tags.mk-selectdrive-page.title%';
	},
	methods: {
		onSelected(file) {
			this.files = [file];
			this.ok();
		},
		onChangeSelection(files) {
			this.files = files;
		},
		upload() {
			(this.$refs.browser as any).selectLocalFile();
		},
		close() {
			window.close();
		},
		ok() {
			window.opener.cb(this.multiple ? this.files : this.files[0]);
			this.close();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mkp-selectdrive
	display block
	position fixed
	width 100%
	height 100%
	background #fff

	> .mk-drive
		height calc(100% - 72px)

	> footer
		position fixed
		bottom 0
		left 0
		width 100%
		height 72px
		background lighten($theme-color, 95%)

		.upload
			display inline-block
			position absolute
			top 8px
			left 16px
			cursor pointer
			padding 0
			margin 8px 4px 0 0
			width 40px
			height 40px
			font-size 1em
			color rgba($theme-color, 0.5)
			background transparent
			outline none
			border solid 1px transparent
			border-radius 4px

			&:hover
				background transparent
				border-color rgba($theme-color, 0.3)

			&:active
				color rgba($theme-color, 0.6)
				background transparent
				border-color rgba($theme-color, 0.5)
				box-shadow 0 2px 4px rgba(darken($theme-color, 50%), 0.15) inset

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
