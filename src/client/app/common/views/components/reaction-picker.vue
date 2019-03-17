<template>
<div class="rdfaahpb" v-hotkey.global="keymap">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ isMobile: $root.isMobile }" ref="popover">
		<p v-if="!$root.isMobile">{{ title }}</p>
		<div ref="buttons" :class="{ showFocus }">
			<button @click="react('like')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="1" :title="$t('@.reactions.like')" v-particle><mk-reaction-icon reaction="like"/></button>
			<button @click="react('love')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="2" :title="$t('@.reactions.love')" v-particle><mk-reaction-icon reaction="love"/></button>
			<button @click="react('laugh')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="3" :title="$t('@.reactions.laugh')" v-particle><mk-reaction-icon reaction="laugh"/></button>
			<button @click="react('hmm')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="4" :title="$t('@.reactions.hmm')" v-particle><mk-reaction-icon reaction="hmm"/></button>
			<button @click="react('surprise')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="5" :title="$t('@.reactions.surprise')" v-particle><mk-reaction-icon reaction="surprise"/></button>
			<button @click="react('congrats')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="6" :title="$t('@.reactions.congrats')" v-particle><mk-reaction-icon reaction="congrats"/></button>
			<button @click="react('angry')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="7" :title="$t('@.reactions.angry')" v-particle><mk-reaction-icon reaction="angry"/></button>
			<button @click="react('confused')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="8" :title="$t('@.reactions.confused')" v-particle><mk-reaction-icon reaction="confused"/></button>
			<button @click="react('rip')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="9" :title="$t('@.reactions.rip')" v-particle><mk-reaction-icon reaction="rip"/></button>
			<button @click="react('pudding')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="10" :title="$t('@.reactions.pudding')" v-particle><mk-reaction-icon reaction="pudding"/></button>
		</div>
		<div class="text">
			<input v-model="text" placeholder="または絵文字を入力" @keyup.enter="reactText" v-autocomplete="{ model: 'text' }">
			<button class="ok" @click="reactText"><fa icon="check"/></button>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import anime from 'animejs';

export default Vue.extend({
	i18n: i18n('common/views/components/reaction-picker.vue'),
	props: {
		note: {
			type: Object,
			required: true
		},

		source: {
			required: true
		},

		cb: {
			required: false
		},

		showFocus: {
			type: Boolean,
			required: false,
			default: false
		},

		animation: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	data() {
		return {
			title: this.$t('choose-reaction'),
			text: null,
			focus: null
		};
	},

	computed: {
		keymap(): any {
			return {
				'esc': this.close,
				'enter|space|plus': this.choose,
				'up|k': this.focusUp,
				'left|h|shift+tab': this.focusLeft,
				'right|l|tab': this.focusRight,
				'down|j': this.focusDown,
				'1': () => this.react('like'),
				'2': () => this.react('love'),
				'3': () => this.react('laugh'),
				'4': () => this.react('hmm'),
				'5': () => this.react('surprise'),
				'6': () => this.react('congrats'),
				'7': () => this.react('angry'),
				'8': () => this.react('confused'),
				'9': () => this.react('rip'),
				'0': () => this.react('pudding'),
			};
		}
	},

	watch: {
		focus(i) {
			this.$refs.buttons.children[i].focus();

			if (this.showFocus) {
				this.title = this.$refs.buttons.children[i].title;
			}
		}
	},

	mounted() {
		this.$nextTick(() => {
			this.focus = 0;

			const popover = this.$refs.popover as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			if (this.$root.isMobile) {
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
				duration: this.animation ? 100 : 0,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.popover,
				opacity: 1,
				scale: [0.5, 1],
				duration: this.animation ? 500 : 0
			});
		});
	},

	methods: {
		react(reaction) {
			this.$root.api('notes/reactions/create', {
				noteId: this.note.id,
				reaction: reaction
			}).then(() => {
				if (this.cb) this.cb();
				this.$emit('closed');
				this.destroyDom();
			});
		},

		reactText() {
			if (!this.text) return;
			this.react(this.text);
		},

		onMouseover(e) {
			this.title = e.target.title;
		},

		onMouseout(e) {
			this.title = this.$t('choose-reaction');
		},

		close() {
			(this.$refs.backdrop as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.backdrop,
				opacity: 0,
				duration: this.animation ? 200 : 0,
				easing: 'linear'
			});

			(this.$refs.popover as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.popover,
				opacity: 0,
				scale: 0.5,
				duration: this.animation ? 200 : 0,
				easing: 'easeInBack',
				complete: () => {
					this.$emit('closed');
					this.destroyDom();
				}
			});
		},

		focusUp() {
			this.focus = this.focus == 0 ? 9 : this.focus < 5 ? (this.focus + 4) : (this.focus - 5);
		},

		focusDown() {
			this.focus = this.focus == 9 ? 0 : this.focus >= 5 ? (this.focus - 4) : (this.focus + 5);
		},

		focusRight() {
			this.focus = this.focus == 9 ? 0 : (this.focus + 1);
		},

		focusLeft() {
			this.focus = this.focus == 0 ? 9 : (this.focus - 1);
		},

		choose() {
			this.$refs.buttons.childNodes[this.focus].click();
		}
	}
});
</script>

<style lang="stylus" scoped>
.rdfaahpb
	position initial

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background var(--modalBackdrop)
		opacity 0

	> .popover
		$bgcolor = var(--popupBg)
		position absolute
		z-index 10001
		background $bgcolor
		border-radius 4px
		box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
		transform scale(0.5)
		opacity 0

		&.isMobile
			> div
				width 280px

				> button
					width 50px
					height 50px
					font-size 28px
					border-radius 4px

		&:not(.isMobile)
			$arrow-size = 16px

			margin-top $arrow-size
			transform-origin center -($arrow-size)

			&:before
				content ""
				display block
				position absolute
				top -($arrow-size * 2)
				left s('calc(50% - %s)', $arrow-size)
				border-top solid $arrow-size transparent
				border-left solid $arrow-size transparent
				border-right solid $arrow-size transparent
				border-bottom solid $arrow-size $bgcolor

		> p
			display block
			margin 0
			padding 8px 10px
			font-size 14px
			color var(--popupFg)
			border-bottom solid var(--lineWidth) var(--faceDivider)

		> div
			padding 4px
			width 240px
			text-align center

			&.showFocus
				> button:focus
					z-index 1

					&:after
						content ""
						pointer-events none
						position absolute
						top 0
						right 0
						bottom 0
						left 0
						border 2px solid var(--primaryAlpha03)
						border-radius 4px

			> button
				padding 0
				width 40px
				height 40px
				font-size 24px
				border-radius 2px

				&:hover
					background var(--reactionPickerButtonHoverBg)

				&:active
					background var(--primary)
					box-shadow inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15)

		> .text
			display flex
			justify-content center
			align-items center

			> input
				width 100%
				padding 12px
				margin 0
				font-size 16px
				color var(--desktopPostFormTextareaFg)
				background var(--desktopPostFormTextareaBg)
				outline none
				border solid 1px var(--primaryAlpha01)
				border-radius 4px
				transition border-color .2s ease

				&:hover
					border-color var(--primaryAlpha02)
					transition border-color .1s ease

				&:focus
					border-color var(--primaryAlpha05)
					transition border-color 0s ease

			> button
				cursor pointer
				padding 0
				margin 0px 4px
				font-size 1em
				color var(--desktopPostFormTransparentButtonFg)
				background transparent
				outline none
				border solid 1px transparent
				border-radius 4px
</style>
