<template>
<MkTooltip ref="tooltip" :showing="showing" :target-element="targetElement" :max-width="250" @closed="emit('closed')">
	<div :class="$style.root">
		<div v-for="u in users" :key="u.id" :class="$style.user">
			<MkAvatar :class="$style.avatar" :user="u"/>
			<MkUserName :class="$style.name" :user="u" :nowrap="true"/>
		</div>
		<div v-if="users.length < count" :class="$style.omitted">+{{ count - users.length }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkTooltip from './MkTooltip.vue';

defineProps<{
	showing: boolean;
	users: any[]; // TODO
	count: number;
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" module>
.root {
	font-size: 0.9em;
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

.name {

}

.omitted {
	
}

.avatar {
	width: 24px;
	height: 24px;
	margin-right: 3px;
}
</style>
