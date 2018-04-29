<template>
<div class="mkw-post-form">
	<template v-if="props.design == 0">
		<p class="title">%fa:pencil-alt%%i18n:@title%</p>
	</template>
	<textarea :disabled="posting" v-model="text" @keydown="onKeydown" placeholder="%i18n:@placeholder%"></textarea>
	<button @click="post" :disabled="posting">%i18n:@note%</button>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'post-form',
	props: () => ({
		design: 0
	})
}).extend({
	data() {
		return {
			posting: false,
			text: ''
		};
	},
	methods: {
		func() {
			if (this.props.design == 1) {
				this.props.design = 0;
			} else {
				this.props.design++;
			}
		},
		onKeydown(e) {
			if ((e.which == 10 || e.which == 13) && (e.ctrlKey || e.metaKey)) this.post();
		},
		post() {
			this.posting = true;

			(this as any).api('notes/create', {
				text: this.text
			}).then(data => {
				this.clear();
			}).catch(err => {
				alert('失敗した');
			}).then(() => {
				this.posting = false;
			});
		},
		clear() {
			this.text = '';
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mkw-post-form
	background #fff
	overflow hidden
	border solid 1px rgba(#000, 0.075)
	border-radius 6px

	> .title
		z-index 1
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(#000, 0.07)

		> [data-fa]
			margin-right 4px

	> textarea
		display block
		width 100%
		max-width 100%
		min-width 100%
		padding 16px
		margin-bottom 28px + 16px
		border none
		border-bottom solid 1px #eee

	> button
		display block
		position absolute
		bottom 8px
		right 8px
		margin 0
		padding 0 10px
		height 28px
		color $theme-color-foreground
		background $theme-color !important
		outline none
		border none
		border-radius 4px
		transition background 0.1s ease
		cursor pointer

		&:hover
			background lighten($theme-color, 10%) !important

		&:active
			background darken($theme-color, 10%) !important
			transition background 0s ease

</style>
