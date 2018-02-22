<template>
<div class="mk-reactions-viewer">
	<template v-if="reactions">
		<span v-if="reactions.like"><mk-reaction-icon reaction='like'/><span>{{ reactions.like }}</span></span>
		<span v-if="reactions.love"><mk-reaction-icon reaction='love'/><span>{{ reactions.love }}</span></span>
		<span v-if="reactions.laugh"><mk-reaction-icon reaction='laugh'/><span>{{ reactions.laugh }}</span></span>
		<span v-if="reactions.hmm"><mk-reaction-icon reaction='hmm'/><span>{{ reactions.hmm }}</span></span>
		<span v-if="reactions.surprise"><mk-reaction-icon reaction='surprise'/><span>{{ reactions.surprise }}</span></span>
		<span v-if="reactions.congrats"><mk-reaction-icon reaction='congrats'/><span>{{ reactions.congrats }}</span></span>
		<span v-if="reactions.angry"><mk-reaction-icon reaction='angry'/><span>{{ reactions.angry }}</span></span>
		<span v-if="reactions.confused"><mk-reaction-icon reaction='confused'/><span>{{ reactions.confused }}</span></span>
		<span v-if="reactions.pudding"><mk-reaction-icon reaction='pudding'/><span>{{ reactions.pudding }}</span></span>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['post'],
	computed: {
		reactions(): number {
			return this.post.reaction_counts;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-reactions-viewer
	border-top dashed 1px #eee
	border-bottom dashed 1px #eee
	margin 4px 0

	&:empty
		display none

	> span
		margin-right 8px

		> .mk-reaction-icon
			font-size 1.4em

		> span
			margin-left 4px
			font-size 1.2em
			color #444

</style>
