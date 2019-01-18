<template>
<div class="mk-reactions-viewer" :class="{ isMe }">
	<template v-if="reactions">
		<span :class="{ reacted: note.myReaction == 'like' }" @click="toggleReaction('like')" v-if="reactions.like" v-particle="!isMe"><mk-reaction-icon reaction="like" ref="like"/><span>{{ reactions.like }}</span></span>
		<span :class="{ reacted: note.myReaction == 'love' }" @click="toggleReaction('love')" v-if="reactions.love" v-particle="!isMe"><mk-reaction-icon reaction="love" ref="love"/><span>{{ reactions.love }}</span></span>
		<span :class="{ reacted: note.myReaction == 'laugh' }" @click="toggleReaction('laugh')" v-if="reactions.laugh" v-particle="!isMe"><mk-reaction-icon reaction="laugh" ref="laugh"/><span>{{ reactions.laugh }}</span></span>
		<span :class="{ reacted: note.myReaction == 'hmm' }" @click="toggleReaction('hmm')" v-if="reactions.hmm" v-particle="!isMe"><mk-reaction-icon reaction="hmm" ref="hmm"/><span>{{ reactions.hmm }}</span></span>
		<span :class="{ reacted: note.myReaction == 'surprise' }" @click="toggleReaction('surprise')" v-if="reactions.surprise" v-particle="!isMe"><mk-reaction-icon reaction="surprise" ref="surprise"/><span>{{ reactions.surprise }}</span></span>
		<span :class="{ reacted: note.myReaction == 'congrats' }" @click="toggleReaction('congrats')" v-if="reactions.congrats" v-particle="!isMe"><mk-reaction-icon reaction="congrats" ref="congrats"/><span>{{ reactions.congrats }}</span></span>
		<span :class="{ reacted: note.myReaction == 'angry' }" @click="toggleReaction('angry')" v-if="reactions.angry" v-particle="!isMe"><mk-reaction-icon reaction="angry" ref="angry"/><span>{{ reactions.angry }}</span></span>
		<span :class="{ reacted: note.myReaction == 'confused' }" @click="toggleReaction('confused')" v-if="reactions.confused" v-particle="!isMe"><mk-reaction-icon reaction="confused" ref="confused"/><span>{{ reactions.confused }}</span></span>
		<span :class="{ reacted: note.myReaction == 'rip' }" @click="toggleReaction('rip')" v-if="reactions.rip" v-particle="!isMe"><mk-reaction-icon reaction="rip" ref="rip"/><span>{{ reactions.rip }}</span></span>
		<span :class="{ reacted: note.myReaction == 'pudding' }" @click="toggleReaction('pudding')" v-if="reactions.pudding" v-particle="!isMe"><mk-reaction-icon reaction="pudding" ref="pudding"/><span>{{ reactions.pudding }}</span></span>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Icon from './reaction-icon.vue';
import anime from 'animejs';

export default Vue.extend({
	props: {
		note: {
			type: Object,
			required: true
		}
	},
	computed: {
		reactions(): any {
			return this.note.reactionCounts;
		},
		isMe(): boolean {
			return this.$store.getters.isSignedIn && (this.$store.state.i.id === this.note.userId);
		}
	},
	watch: {
		'reactions.like'() {
			this.anime('like');
		},
		'reactions.love'() {
			this.anime('love');
		},
		'reactions.laugh'() {
			this.anime('laugh');
		},
		'reactions.hmm'() {
			this.anime('hmm');
		},
		'reactions.surprise'() {
			this.anime('surprise');
		},
		'reactions.congrats'() {
			this.anime('congrats');
		},
		'reactions.angry'() {
			this.anime('angry');
		},
		'reactions.confused'() {
			this.anime('confused');
		},
		'reactions.rip'() {
			this.anime('rip');
		},
		'reactions.pudding'() {
			this.anime('pudding');
		}
	},
	methods: {
		toggleReaction(reaction: string) {
			if (this.isMe) return;

			const oldReaction = this.note.myReaction;
			if (oldReaction) {
				this.$root.api('notes/reactions/delete', {
					noteId: this.note.id
				}).then(() => {
					if (oldReaction !== reaction) {
						this.$root.api('notes/reactions/create', {
							noteId: this.note.id,
							reaction: reaction
						});
					}
				});
			} else {
				this.$root.api('notes/reactions/create', {
					noteId: this.note.id,
					reaction: reaction
				});
			}
		},
		anime(reaction: string) {
			if (this.$store.state.device.reduceMotion) return;
			if (document.hidden) return;

			this.$nextTick(() => {
				const rect = this.$refs[reaction].$el.getBoundingClientRect();

				const x = rect.left;
				const y = rect.top;

				const icon = new Icon({
					parent: this,
					propsData: {
						reaction: reaction
					}
				}).$mount();

				icon.$el.style.position = 'absolute';
				icon.$el.style.zIndex = 100;
				icon.$el.style.top = (y + window.scrollY) + 'px';
				icon.$el.style.left = (x + window.scrollX) + 'px';
				icon.$el.style.fontSize = window.getComputedStyle(this.$refs[reaction].$el).fontSize;

				document.body.appendChild(icon.$el);

				anime({
					targets: icon.$el,
					opacity: [1, 0],
					translateY: [0, -64],
					duration: 1000,
					easing: 'linear',
					complete: () => {
						icon.destroyDom();
					}
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-reactions-viewer
	margin 6px 0

	&:empty
		display none

	&.isMe
		> span
			cursor default !important

			&:hover
				background var(--reactionViewerButtonBg) !important

	> span
		display inline-block
		height 32px
		margin-right 6px
		padding 0 6px
		border-radius 4px
		cursor pointer

		*
			user-select none
			pointer-events none

		&.reacted
			background var(--primary)

			> span
				color var(--primaryForeground)

		&:not(.reacted)
			background var(--reactionViewerButtonBg)

			&:hover
				background var(--reactionViewerButtonHoverBg)

		> .mk-reaction-icon
			font-size 1.4em

		> span
			font-size 1.1em
			line-height 32px
			vertical-align middle
			color var(--text)

</style>
