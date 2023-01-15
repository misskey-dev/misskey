<template>
<MkTooltip ref="tooltip" :showing="showing" :target-element="targetElement" :max-width="340" @closed="emit('closed')">
	<div :class="$style.root">
		<div :class="$style.reaction">
			<MkReactionIcon :reaction="reaction" :class="$style.reactionIcon" :no-style="true"/>
			<div :class="$style.reactionName">{{ getReactionName(reaction) }}</div>
		</div>
		<div :class="$style.users">
			<div v-for="u in users" :key="u.id" :class="$style.user">
				<MkAvatar :class="$style.avatar" :user="u"/>
				<MkUserName :user="u" :nowrap="true"/>
			</div>
			<div v-if="users.length > 10">+{{ count - 10 }}</div>
		</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkTooltip from './MkTooltip.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';
import { getEmojiName } from '@/scripts/emojilist';

defineProps<{
	showing: boolean;
	reaction: string;
	users: any[]; // TODO
	count: number;
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

function getReactionName(reaction: string): string {
	const trimLocal = reaction.replace('@.', '');
	if (trimLocal.startsWith(':')) {
		return trimLocal;
	}
	return getEmojiName(reaction) ?? reaction;
}
</script>

<style lang="scss" module>
.root {
	display: flex;
}

.reaction {
	max-width: 100px;
	text-align: center;
}

.reactionIcon {
	display: block;
	width: 60px;
	font-size: 60px; // unicodeな絵文字についてはwidthが効かないため
	object-fit: contain;
	margin: 0 auto;
}

.reactionName {
	font-size: 1em;
}

.users {
	flex: 1;
	min-width: 0;
	font-size: 0.95em;
	border-left: solid 0.5px var(--divider);
	padding-left: 10px;
	margin-left: 10px;
	margin-right: 14px;
	text-align: left;
}

.user {
	line-height: 24px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	&:not(:last-child) {
		margin-bottom: 3px;
	}
}

.avatar {
	width: 24px;
	height: 24px;
	margin-right: 3px;
}
</style>
