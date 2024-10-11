<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i>{{ i18n.ts.remoteUserCaution }}<a :class="$style.link" :href="href" rel="nofollow noopener" target="_blank">{{ i18n.ts.showOnRemote }}</a></div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';

defineProps<{
	href: string;
}>();
</script>

<style lang="scss" module>
.root {
	font-size: 0.8em;
	padding: 16px;
	background: var(--MI_THEME-infoWarnBg);
	color: var(--MI_THEME-infoWarnFg);
	border-radius: var(--MI-radius);
	overflow: clip;
}

.link {
	margin-left: 4px;
	color: var(--MI_THEME-accent);
}
</style>
