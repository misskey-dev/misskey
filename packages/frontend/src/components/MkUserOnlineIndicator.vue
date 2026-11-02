<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-tooltip="text"
	:class="[$style.root, {
		[$style.status_online]: user.onlineStatus === 'online',
		[$style.status_active]: user.onlineStatus === 'active',
		[$style.status_offline]: user.onlineStatus === 'offline',
		[$style.status_unknown]: user.onlineStatus === 'unknown',
	}]"
></div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	user: Misskey.entities.User;
}>();

const text = computed(() => {
	switch (props.user.onlineStatus) {
		case 'online': return i18n.ts.online;
		case 'active': return i18n.ts.active;
		case 'offline': return i18n.ts.offline;
		case 'unknown': return i18n.ts.unknown;
	}
});
</script>

<style lang="scss" module>
.root {
	box-shadow: 0 0 0 3px var(--MI_THEME-panel);
	border-radius: 120%; // Blinkのバグか知らんけど、100%ぴったりにすると何故か若干楕円でレンダリングされる

	&.status_online {
		background: #58d4c9;
	}

	&.status_active {
		background: #e4bc48;
	}

	&.status_offline {
		background: #ea5353;
	}

	&.status_unknown {
		background: #888;
	}
}
</style>
