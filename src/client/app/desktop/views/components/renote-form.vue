<template>
<div class="mk-renote-form">
	<mk-note-preview :note="note"/>
	<template v-if="!quote">
		<footer>
			<a class="quote" v-if="!quote" @click="onQuote">%i18n:@quote%</a>
			<button class="cancel" @click="cancel">%i18n:@cancel%</button>
			<button class="ok" @click="ok" :disabled="wait">{{ wait ? '%i18n:@reposting%' : '%i18n:@renote%' }}</button>
		</footer>
	</template>
	<template v-if="quote">
		<mk-post-form ref="form" :renote="note" @posted="onChildFormPosted"/>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['note'],
	data() {
		return {
			wait: false,
			quote: false
		};
	},
	methods: {
		ok() {
			this.wait = true;
			(this as any).api('notes/create', {
				renoteId: this.note.id
			}).then(data => {
				this.$emit('posted');
				(this as any).apis.notify('%i18n:@success%');
			}).catch(err => {
				(this as any).apis.notify('%i18n:@failure%');
			}).then(() => {
				this.wait = false;
			});
		},
		cancel() {
			this.$emit('canceled');
		},
		onQuote() {
			this.quote = true;

			this.$nextTick(() => {
				(this.$refs.form as any).focus();
			});
		},
		onChildFormPosted() {
			this.$emit('posted');
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-renote-form

	> .mk-note-preview
		margin 16px 22px

	> footer
		height 72px
		background lighten($theme-color, 95%)

		> .quote
			position absolute
			bottom 16px
			left 28px
			line-height 40px

		button
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

		> .cancel
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

		> .ok
			right 16px
			font-weight bold
			color $theme-color-foreground
			background linear-gradient(to bottom, lighten($theme-color, 25%) 0%, lighten($theme-color, 10%) 100%)
			border solid 1px lighten($theme-color, 15%)

			&:hover
				background linear-gradient(to bottom, lighten($theme-color, 8%) 0%, darken($theme-color, 8%) 100%)
				border-color $theme-color

			&:active
				background $theme-color
				border-color $theme-color

</style>
