<template>
<div class="tdflqwzn" :class="{ isMe }">
	<XReaction v-for="(count, reaction) in note.reactions" :reaction="reaction" :count="count" :is-initial="initialReactions.has(reaction)" :note="note" :key="reaction"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XReaction from './reactions-viewer.reaction.vue';

export default defineComponent({
	components: {
		XReaction
	},
	props: {
		note: {
			type: Object,
			required: true
		},
	},
	data() {
		return {
			initialReactions: new Set(Object.keys(this.note.reactions))
		};
	},
	computed: {
		isMe(): boolean {
			return this.$i && this.$i.id === this.note.userId;
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
