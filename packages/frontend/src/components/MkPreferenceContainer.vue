<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.body">
		<slot></slot>
	</div>
	<div :class="$style.menu">
		<button class="_button" style="color: var(--MI_THEME-fg)" @click="showMenu"><i class="ti ti-dots"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { profileManager } from '@/preferences.js';

const props = withDefaults(defineProps<{
	k: string;
}>(), {
});

function showMenu(ev: MouseEvent) {
	const overrideByAccount = ref(profileManager.isAccountOverrided(props.k));

	watch(overrideByAccount, () => {
		if (overrideByAccount.value) {
			profileManager.setAccountOverride(props.k);
		} else {
			profileManager.clearAccountOverride(props.k);
		}
	});

	os.popupMenu([{
		icon: 'ti ti-copy',
		text: i18n.ts.copyPreferenceId,
		action: () => {
			copyToClipboard(props.k);
		},
	}, {
		icon: 'ti ti-refresh',
		text: i18n.ts.resetToDefaultValue,
		danger: true,
		action: () => {
			// TODO
		},
	}, {
		type: 'divider',
	}, {
		type: 'switch',
		icon: 'ti ti-user-cog',
		text: i18n.ts.overrideByAccount,
		ref: overrideByAccount,
	}], ev.currentTarget ?? ev.target);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;

	&:hover {
		&::after {
			content: '';
			position: absolute;
			top: -8px;
			left: -8px;
			width: calc(100% + 16px);
			height: calc(100% + 16px);
			border-radius: 8px;
			background: light-dark(rgba(0, 0, 0, 0.02), rgba(255, 255, 255, 0.02));
			pointer-events: none;
		}

		.menu {
			opacity: 0.7;
		}
	}

	.body {
		flex: 1;
	}

	.menu {
		align-content: center;
		margin-left: 12px;
		font-size: 12px;
		opacity: 0.3;

		&:hover {
			opacity: 1;
		}
	}
}
</style>
