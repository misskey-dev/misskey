<template>
<MkTooltip ref="tooltip" :showing="showing" :target-element="targetElement" :max-width="340" @closed="emit('closed')">
	<div class="bqxuuuey">
		<div class="reaction">
			<MkReactionIcon :reaction="reaction" class="icon" :no-style="true"/>
			<div class="name">{{ getReactionName(reaction) }}</div>
		</div>
		<div class="users">
			<div v-for="u in users" :key="u.id" class="user">
				<MkAvatar class="avatar" :user="u"/>
				<MkUserName class="name" :user="u" :nowrap="true"/>
			</div>
			<div v-if="users.length > 10" class="omitted">+{{ count - 10 }}</div>
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

<style lang="scss" scoped>
.bqxuuuey {
	display: flex;

	> .reaction {
		max-width: 100px;
		text-align: center;

		> .icon {
			display: block;
			width: 60px;
			font-size: 60px; // unicodeな絵文字についてはwidthが効かないため
			object-fit: contain;
			margin: 0 auto;
		}

		> .name {
			font-size: 1em;
		}
	}

	> .users {
		flex: 1;
		min-width: 0;
		font-size: 0.95em;
		border-left: solid 0.5px var(--divider);
		padding-left: 10px;
		margin-left: 10px;
		margin-right: 14px;
		text-align: left;

		> .user {
			line-height: 24px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			&:not(:last-child) {
				margin-bottom: 3px;
			}

			> .avatar {
				width: 24px;
				height: 24px;
				margin-right: 3px;
			}
		}
	}
}
</style>
