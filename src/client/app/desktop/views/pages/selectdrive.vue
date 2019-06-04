<template>
<div class="mkp-selectdrive">
	<x-drive ref="browser"
		:multiple="multiple"
		@selected="onSelected"
		@change-selection="onChangeSelection"
	/>
	<footer>
		<button class="upload" :title="$t('upload')" @click="upload"><fa icon="upload"/></button>
		<button class="cancel" @click="close">{{ $t('cancel') }}</button>
		<button class="ok" @click="ok">{{ $t('ok') }}</button>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/selectdrive.vue'),
	components: {
		XDrive: () => import('../components/drive.vue').then(m => m.default),
	},
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
		document.title = this.$t('title');
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
			(this.$refs.browser as unknown).selectLocalFile();
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
		background var(--primaryLighten95)

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
			color var(--primaryAlpha05)
			background transparent
			outline none
			border solid 1px transparent
			border-radius 4px

			&:hover
				background transparent
				border-color var(--primaryAlpha03)

			&:active
				color var(--primaryAlpha06)
				background transparent
				border-color var(--primaryAlpha05)
				//box-shadow 0 2px 4px rgba(var(--primaryDarken50), 0.15) inset

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
