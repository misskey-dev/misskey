<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.main">
	<span :class="$style.icon">
		<i v-if="!entity.isActive" class="ti ti-player-pause"/>
		<i v-else-if="entity.latestStatus === null" class="ti ti-circle"/>
		<i
			v-else-if="[200, 201, 204].includes(entity.latestStatus)"
			class="ti ti-check"
			:style="{ color: 'var(--success)' }"
		/>
		<i v-else class="ti ti-alert-triangle" :style="{ color: 'var(--error)' }"/>
	</span>
	<span :class="$style.text">{{ entity.name || entity.url }}</span>
	<span :class="$style.suffix">
		<MkTime v-if="entity.latestSentAt" :time="entity.latestSentAt" style="margin-right: 8px"/>
		<button :class="$style.suffixButton" @click="onEditClick">
			<i class="ti ti-settings"></i>
		</button>
		<button :class="$style.suffixButton" @click="onDeleteClick">
			<i class="ti ti-trash"></i>
		</button>
	</span>
</div>
</template>

<script lang="ts" setup>
import { entities } from 'misskey-js';
import { toRefs } from 'vue';

const emit = defineEmits<{
	(ev: 'edit', value: entities.SystemWebhook): void;
	(ev: 'delete', value: entities.SystemWebhook): void;
}>();

const props = defineProps<{
	entity: entities.SystemWebhook;
}>();

const { entity } = toRefs(props);

function onEditClick() {
	emit('edit', entity.value);
}

function onDeleteClick() {
	emit('delete', entity.value);
}

</script>

<style module lang="scss">
.main {
	display: flex;
	align-items: center;
	width: 100%;
	box-sizing: border-box;
	padding: 10px 14px;
	background: var(--buttonBg);
	border: none;
	border-radius: 6px;
	font-size: 0.9em;

	&:hover {
		text-decoration: none;
		background: var(--buttonHoverBg);
	}

	&.active {
		color: var(--accent);
		background: var(--buttonHoverBg);
	}
}

.icon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	color: var(--fgTransparentWeak);
}

.text {
	flex-shrink: 1;
	white-space: normal;
	padding-right: 12px;
	text-align: center;
}

.suffix {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	gaps: 4px;
	margin-left: auto;
	margin-right: -8px;
	opacity: 0.7;
	white-space: nowrap;
}

.suffixButton {
	background: transparent;
	border: none;
	border-radius: 9999px;
	margin-top: -8px;
	margin-bottom: -8px;
	padding: 8px;

	&:hover {
		background: var(--buttonBg);
	}
}
</style>
