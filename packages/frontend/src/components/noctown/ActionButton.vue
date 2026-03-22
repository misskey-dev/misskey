<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.container">
	<button
		:class="[$style.button, $style.primary]"
		:disabled="disabled"
		@touchstart.prevent="onPrimaryPress"
		@touchend.prevent="onPrimaryRelease"
		@click="onPrimaryClick"
	>
		<i :class="primaryIcon"></i>
		<span v-if="primaryLabel" :class="$style.label">{{ primaryLabel }}</span>
	</button>

	<button
		v-if="showSecondary"
		:class="[$style.button, $style.secondary]"
		:disabled="secondaryDisabled"
		@touchstart.prevent="onSecondaryPress"
		@touchend.prevent="onSecondaryRelease"
		@click="onSecondaryClick"
	>
		<i :class="secondaryIcon"></i>
	</button>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const emit = defineEmits<{
	(e: 'primary'): void;
	(e: 'secondary'): void;
	(e: 'primary-hold'): void;
	(e: 'secondary-hold'): void;
}>();

const props = withDefaults(defineProps<{
	primaryIcon?: string;
	primaryLabel?: string;
	secondaryIcon?: string;
	showSecondary?: boolean;
	disabled?: boolean;
	secondaryDisabled?: boolean;
	holdDelay?: number;
}>(), {
	primaryIcon: 'ti ti-hand-grab',
	primaryLabel: '',
	secondaryIcon: 'ti ti-message',
	showSecondary: true,
	disabled: false,
	secondaryDisabled: false,
	holdDelay: 500,
});

// Hold detection
const primaryHoldTimer = ref<number | null>(null);
const secondaryHoldTimer = ref<number | null>(null);
const primaryWasHeld = ref(false);
const secondaryWasHeld = ref(false);

function onPrimaryPress(): void {
	if (props.disabled) return;

	primaryWasHeld.value = false;
	primaryHoldTimer.value = window.setTimeout(() => {
		primaryWasHeld.value = true;
		emit('primary-hold');
	}, props.holdDelay);
}

function onPrimaryRelease(): void {
	if (primaryHoldTimer.value) {
		window.clearTimeout(primaryHoldTimer.value);
		primaryHoldTimer.value = null;
	}
}

function onPrimaryClick(): void {
	if (props.disabled) return;
	if (!primaryWasHeld.value) {
		emit('primary');
	}
	primaryWasHeld.value = false;
}

function onSecondaryPress(): void {
	if (props.secondaryDisabled) return;

	secondaryWasHeld.value = false;
	secondaryHoldTimer.value = window.setTimeout(() => {
		secondaryWasHeld.value = true;
		emit('secondary-hold');
	}, props.holdDelay);
}

function onSecondaryRelease(): void {
	if (secondaryHoldTimer.value) {
		window.clearTimeout(secondaryHoldTimer.value);
		secondaryHoldTimer.value = null;
	}
}

function onSecondaryClick(): void {
	if (props.secondaryDisabled) return;
	if (!secondaryWasHeld.value) {
		emit('secondary');
	}
	secondaryWasHeld.value = false;
}
</script>

<style lang="scss" module>
.container {
	position: fixed;
	bottom: 80px;
	right: 30px;
	display: flex;
	flex-direction: column;
	gap: 12px;
	z-index: 100;
}

.button {
	width: 60px;
	height: 60px;
	border-radius: 50%;
	border: none;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	cursor: pointer;
	touch-action: manipulation;
	transition: transform 0.1s, opacity 0.2s;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

	&:active {
		transform: scale(0.9);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	i {
		font-size: 24px;
	}
}

.primary {
	background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
	color: white;
}

.secondary {
	width: 50px;
	height: 50px;
	background: rgba(255, 255, 255, 0.9);
	color: #333;

	i {
		font-size: 20px;
	}
}

.label {
	font-size: 10px;
	font-weight: bold;
}
</style>
