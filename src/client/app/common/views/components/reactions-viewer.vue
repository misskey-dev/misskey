<template>
<div class="mk-reactions-viewer">
	<template v-if="reactions">
		<span :class="{ reacted: note.myReaction == 'like' }" @click="react('like')" v-if="reactions.like"><mk-reaction-icon reaction="like"/><span>{{ reactions.like }}</span></span>
		<span :class="{ reacted: note.myReaction == 'love' }" @click="react('love')" v-if="reactions.love"><mk-reaction-icon reaction="love"/><span>{{ reactions.love }}</span></span>
		<span :class="{ reacted: note.myReaction == 'laugh' }" @click="react('laugh')" v-if="reactions.laugh"><mk-reaction-icon reaction="laugh"/><span>{{ reactions.laugh }}</span></span>
		<span :class="{ reacted: note.myReaction == 'hmm' }" @click="react('hmm')" v-if="reactions.hmm"><mk-reaction-icon reaction="hmm"/><span>{{ reactions.hmm }}</span></span>
		<span :class="{ reacted: note.myReaction == 'surprise' }" @click="react('surprise')" v-if="reactions.surprise"><mk-reaction-icon reaction="surprise"/><span>{{ reactions.surprise }}</span></span>
		<span :class="{ reacted: note.myReaction == 'congrats' }" @click="react('congrats')" v-if="reactions.congrats"><mk-reaction-icon reaction="congrats"/><span>{{ reactions.congrats }}</span></span>
		<span :class="{ reacted: note.myReaction == 'angry' }" @click="react('angry')" v-if="reactions.angry"><mk-reaction-icon reaction="angry"/><span>{{ reactions.angry }}</span></span>
		<span :class="{ reacted: note.myReaction == 'confused' }" @click="react('confused')" v-if="reactions.confused"><mk-reaction-icon reaction="confused"/><span>{{ reactions.confused }}</span></span>
		<span :class="{ reacted: note.myReaction == 'rip' }" @click="react('rip')" v-if="reactions.rip"><mk-reaction-icon reaction="rip"/><span>{{ reactions.rip }}</span></span>
		<span :class="{ reacted: note.myReaction == 'pudding' }" @click="react('pudding')" v-if="reactions.pudding"><mk-reaction-icon reaction="pudding"/><span>{{ reactions.pudding }}</span></span>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['note'],
	computed: {
		reactions(): number {
			return this.note.reactionCounts;
		}
	},
	methods: {
		react(reaction: string) {
			(this as any).api('notes/reactions/create', {
				noteId: this.note.id,
				reaction: reaction
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

	> span
		display inline-block
		height 32px
		margin-right 6px
		padding 0 6px
		border-radius 4px

		*
			user-select none
			pointer-events none

		&.reacted
			background var(--primary)

			> span
				color var(--primaryForeground)

		&:not(.reacted)
			cursor pointer
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
