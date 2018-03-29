<template>
<div class="mk-reaction-picker">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ compact }" ref="popover">
		<p v-if="!compact">{{ title }}</p>
		<div>
			<button @click="react('like')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="1" title="%i18n:common.reactions.like%"><mk-reaction-icon reaction='like'/></button>
			<button @click="react('love')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="2" title="%i18n:common.reactions.love%"><mk-reaction-icon reaction='love'/></button>
			<button @click="react('laugh')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="3" title="%i18n:common.reactions.laugh%"><mk-reaction-icon reaction='laugh'/></button>
			<button @click="react('hmm')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="4" title="%i18n:common.reactions.hmm%"><mk-reaction-icon reaction='hmm'/></button>
			<button @click="react('surprise')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="5" title="%i18n:common.reactions.surprise%"><mk-reaction-icon reaction='surprise'/></button>
			<button @click="react('congrats')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="6" title="%i18n:common.reactions.congrats%"><mk-reaction-icon reaction='congrats'/></button>
			<button @click="react('angry')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="4" title="%i18n:common.reactions.angry%"><mk-reaction-icon reaction='angry'/></button>
			<button @click="react('confused')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="5" title="%i18n:common.reactions.confused%"><mk-reaction-icon reaction='confused'/></button>
			<button @click="react('pudding')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="6" title="%i18n:common.reactions.pudding%"><mk-reaction-icon reaction='pudding'/></button>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

const placeholder = '%i18n:common.tags.mk-reaction-picker.choose-reaction%';

export default Vue.extend({
	props: ['post', 'source', 'compact', 'cb'],
	data() {
		return {
			title: placeholder
		};
	},
	mounted() {
		this.$nextTick(() => {
			const popover = this.$refs.popover as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			if (this.compact) {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);
				popover.style.left = (x - (width / 2)) + 'px';
				popover.style.top = (y - (height / 2)) + 'px';
			} else {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + this.source.offsetHeight;
				popover.style.left = (x - (width / 2)) + 'px';
				popover.style.top = y + 'px';
			}

			anime({
				targets: this.$refs.backdrop,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.popover,
				opacity: 1,
				scale: [0.5, 1],
				duration: 500
			});
		});
	},
	methods: {
		react(reaction) {
			(this as any).api('posts/reactions/create', {
				postId: this.post.id,
				reaction: reaction
			}).then(() => {
				if (this.cb) this.cb();
				this.$destroy();
			});
		},
		onMouseover(e) {
			this.title = e.target.title;
		},
		onMouseout(e) {
			this.title = placeholder;
		},
		close() {
			(this.$refs.backdrop as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.backdrop,
				opacity: 0,
				duration: 200,
				easing: 'linear'
			});

			(this.$refs.popover as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.popover,
				opacity: 0,
				scale: 0.5,
				duration: 200,
				easing: 'easeInBack',
				complete: () => this.$destroy()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

$border-color = rgba(27, 31, 35, 0.15)

.mk-reaction-picker
	position initial

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background rgba(0, 0, 0, 0.1)
		opacity 0

	> .popover
		position absolute
		z-index 10001
		background #fff
		border 1px solid $border-color
		border-radius 4px
		box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
		transform scale(0.5)
		opacity 0

		$balloon-size = 16px

		&:not(.compact)
			margin-top $balloon-size
			transform-origin center -($balloon-size)

			&:before
				content ""
				display block
				position absolute
				top -($balloon-size * 2)
				left s('calc(50% - %s)', $balloon-size)
				border-top solid $balloon-size transparent
				border-left solid $balloon-size transparent
				border-right solid $balloon-size transparent
				border-bottom solid $balloon-size $border-color

			&:after
				content ""
				display block
				position absolute
				top -($balloon-size * 2) + 1.5px
				left s('calc(50% - %s)', $balloon-size)
				border-top solid $balloon-size transparent
				border-left solid $balloon-size transparent
				border-right solid $balloon-size transparent
				border-bottom solid $balloon-size #fff

		> p
			display block
			margin 0
			padding 8px 10px
			font-size 14px
			color #586069
			border-bottom solid 1px #e1e4e8

		> div
			padding 4px
			width 240px
			text-align center

			> button
				padding 0
				width 40px
				height 40px
				font-size 24px
				border-radius 2px

				&:hover
					background #eee

				&:active
					background $theme-color
					box-shadow inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15)

</style>
