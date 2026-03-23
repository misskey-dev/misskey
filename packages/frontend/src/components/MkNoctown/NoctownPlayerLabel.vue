<!--
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div :class="$style.playerLabel">
		<div :class="$style.statusMark" :style="{ backgroundColor: statusColor }"></div>
		<img v-if="avatarUrl" :src="avatarUrl" :alt="username" :class="$style.avatar" @error="onAvatarError">
		<div v-else :class="$style.defaultAvatar">👤</div>
		<div :class="$style.username">{{ displayName || username }}</div>
	</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

interface Props {
	username: string;
	displayName?: string | null;
	avatarUrl?: string | null;
	isOnline: boolean;
}

const props = defineProps<Props>();

const avatarLoadError = ref(false);

const statusColor = computed(() => {
	return props.isOnline ? '#22c55e' : '#ef4444'; // green-500 / red-500
});

const onAvatarError = () => {
	avatarLoadError.value = true;
};
</script>

<style module lang="scss">
.playerLabel {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 8px;
	background-color: rgba(0, 0, 0, 0.7);
	border-radius: 12px;
	pointer-events: none;
	user-select: none;
	font-size: 12px;
	color: white;
	white-space: nowrap;
}

.statusMark {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	flex-shrink: 0;
}

.avatar {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	object-fit: cover;
	flex-shrink: 0;
}

.defaultAvatar {
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	flex-shrink: 0;
}

.username {
	font-weight: 500;
	max-width: 120px;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
