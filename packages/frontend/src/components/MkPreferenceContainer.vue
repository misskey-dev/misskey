<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" @contextmenu.prevent.stop="showMenu($event, true)">
	<div :class="$style.body">
		<slot></slot>
	</div>
	<div :class="$style.menu">
		<i v-if="isSyncEnabled" class="ti ti-cloud-cog" style="color: var(--MI_THEME-accent); opacity: 0.7;"></i>
		<i v-if="isAccountOverrided" class="ti ti-user-cog" style="color: var(--MI_THEME-accent); opacity: 0.7;"></i>
		<div :class="$style.buttons">
			<button class="_button" style="color: var(--MI_THEME-fg)" @click="showMenu($event)"><i class="ti ti-dots"></i></button>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { PREF_DEF } from '@/preferences/def.js';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';

const props = withDefaults(defineProps<{
	k: keyof typeof PREF_DEF;
}>(), {
});

const isAccountOverrided = ref(prefer.isAccountOverrided(props.k));
const isSyncEnabled = ref(prefer.isSyncEnabled(props.k));

function showMenu(ev: PointerEvent, contextmenu?: boolean) {
	const i = window.setInterval(() => {
		isAccountOverrided.value = prefer.isAccountOverrided(props.k);
		isSyncEnabled.value = prefer.isSyncEnabled(props.k);
	}, 100);
	if (contextmenu) {
		os.contextMenu(prefer.getPerPrefMenu(props.k), ev).then(() => {
			window.clearInterval(i);
		});
	} else {
		os.popupMenu(prefer.getPerPrefMenu(props.k), ev.currentTarget ?? ev.target, {
			onClosing: () => {
				window.clearInterval(i);
			},
		});
	}
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;

	&:hover {
		&::before {
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
			.buttons {
				opacity: 0.7;
			}
		}
	}

	.body {
		flex: 1;
	}

	.menu {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-left: 12px;
		font-size: 12px;
		padding-left: 8px;
		border-left: solid 1px var(--MI_THEME-divider);

		&:hover {
			.buttons {
				opacity: 1;
			}
		}

		.buttons {
			opacity: 0.3;
		}
	}
}
</style>
