<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="clockSkewWarningVisible" :class="$style.root" role="status">
	<i class="ti ti-alert-triangle" :class="$style.icon" aria-hidden="true"></i>
	<strong :class="$style.title">{{ i18n.ts._clockSkewWarning.title }}</strong>
	<button type="button" class="_textButton" :class="$style.details" @click="showDetails">{{ i18n.ts.details }}</button>
	<button type="button" class="_textButton" :class="$style.desktopDismiss" @click="dismissClockSkewWarning">{{ i18n.ts._clockSkewWarning.dismiss }}</button>
	<button type="button" class="_button" :class="$style.mobileMenu" :aria-label="i18n.ts.menu" @click="showMenu">
		<i class="ti ti-dots" aria-hidden="true"></i>
	</button>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { clockSkewWarningVisible, dismissClockSkewWarning } from '@/utility/check-clock-skew.js';

function showDetails(): void {
	void os.alert({
		type: 'warning',
		title: i18n.ts._clockSkewWarning.title,
		text: i18n.ts._clockSkewWarning.description,
	});
}

function showMenu(ev: MouseEvent): void {
	void os.popupMenu([{
		text: i18n.ts._clockSkewWarning.dismiss,
		icon: 'ti ti-eye-off',
		action: dismissClockSkewWarning,
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
	display: flex;
	align-items: center;
	flex-shrink: 0;
	gap: 10px;
	height: 24px;
	padding: 0 10px;
	background: var(--MI_THEME-infoWarnBg);
	color: var(--MI_THEME-infoWarnFg);
	font-size: 0.85em;
	line-height: 24px;
	white-space: nowrap;
}

.icon {
	flex-shrink: 0;
}

.title {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.details {
	margin-left: auto;
	flex-shrink: 0;
	color: inherit;
}

.desktopDismiss {
	flex-shrink: 0;
	color: inherit;
}

.mobileMenu {
	display: none;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	color: inherit;
}

@container (max-width: 500px) {
	.desktopDismiss {
		display: none;
	}

	.mobileMenu {
		display: flex;
	}
}
</style>
