<template>
<div class="tdflqwzn" :class="{ isMe }">
	<x-reaction v-for="(count, reaction) in reactions" :reaction="reaction" :count="count" :is-initial="initialReactions.has(reaction)" :note="note" :my-reaction="myReaction" :emojis="emojis" :key="reaction"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XReaction from './reactions-viewer.reaction.vue';

export default Vue.extend({
	components: {
		XReaction
	},
	props: {
		note: {
			type: Object,
			required: true
		},
		reactions: {
			type: Object,
			required: true
		},
		myReaction: {
			type: String,
			required: false,
		},
		emojis: {
			type: Array,
			required: true,
		},
	},
	data() {
		return {
			initialReactions: new Set(Object.keys(this.note.reactions))
		};
	},
	computed: {
		isMe(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.id === this.note.userId;
		},
	},
});
</script>

<style lang="scss" scoped>
.tdflqwzn {
	margin: 4px -2px 0 -2px;

	&:empty {
		display: none;
	}

	&.isMe {
		> span {
			cursor: default !important;
		}
	}
}
</style>
