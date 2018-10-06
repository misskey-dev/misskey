<template>
<div class="mk-reactions-viewer">
	<template v-if="reactions">
		<span :class="{notReacted}" @click="react('like')" v-if="reactions.like"><mk-reaction-icon reaction="like"/><span>{{ reactions.like }}</span></span>
		<span :class="{notReacted}" @click="react('love')" v-if="reactions.love"><mk-reaction-icon reaction="love"/><span>{{ reactions.love }}</span></span>
		<span :class="{notReacted}" @click="react('laugh')" v-if="reactions.laugh"><mk-reaction-icon reaction="laugh"/><span>{{ reactions.laugh }}</span></span>
		<span :class="{notReacted}" @click="react('hmm')" v-if="reactions.hmm"><mk-reaction-icon reaction="hmm"/><span>{{ reactions.hmm }}</span></span>
		<span :class="{notReacted}" @click="react('surprise')" v-if="reactions.surprise"><mk-reaction-icon reaction="surprise"/><span>{{ reactions.surprise }}</span></span>
		<span :class="{notReacted}" @click="react('congrats')" v-if="reactions.congrats"><mk-reaction-icon reaction="congrats"/><span>{{ reactions.congrats }}</span></span>
		<span :class="{notReacted}" @click="react('angry')" v-if="reactions.angry"><mk-reaction-icon reaction="angry"/><span>{{ reactions.angry }}</span></span>
		<span :class="{notReacted}" @click="react('confused')" v-if="reactions.confused"><mk-reaction-icon reaction="confused"/><span>{{ reactions.confused }}</span></span>
		<span :class="{notReacted}" @click="react('rip')" v-if="reactions.rip"><mk-reaction-icon reaction="rip"/><span>{{ reactions.rip }}</span></span>
		<span :class="{notReacted}" @click="react('pudding')" v-if="reactions.pudding"><mk-reaction-icon reaction="pudding"/><span>{{ reactions.pudding }}</span></span>
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
		},
		notReacted(): boolean {
			return this.note.myReaction == null;
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
		margin-right 6px
		padding 6px 6px 6px 4px
		border solid 1px var(--reactionViewerButtonBorder)
		border-radius 3px

		&.notReacted
			cursor pointer

			&:hover
				border solid 1px var(--reactionViewerButtonHoverBorder)

		> .mk-reaction-icon
			font-size 1.4em

		> span
			margin-left 4px
			font-size 1.2em
			color var(--text)

</style>
