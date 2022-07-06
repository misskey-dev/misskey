<template>
<MkTooltip ref="tooltip" :target-element="targetElement" :max-width="250" @closed="emit('closed')">
	<div class="beaffaef">
		<div v-for="u in users" :key="u.id" class="user">
			<MkAvatar class="avatar" :user="u"/>
			<MkUserName class="name" :user="u" :nowrap="true"/>
		</div>
		<div v-if="users.length < count" class="omitted">+{{ count - users.length }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkTooltip from './ui/tooltip.vue';

const props = defineProps<{
	users: any[]; // TODO
	count: number;
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" scoped>
.beaffaef {
	font-size: 0.9em;
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
</style>
