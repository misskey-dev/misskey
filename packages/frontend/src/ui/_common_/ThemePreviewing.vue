<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<span :class="$style.icon">
		<i class="ti ti-info-circle"></i>
	</span>
	<span :class="$style.title">{{ i18n.ts.previewingTheme }}</span>
	<span :class="$style.body"><button class="_textButton" style="color: var(--MI_THEME-fgOnAccent);" @click="restore">{{ i18n.ts.previewingThemeRestore }}</button> | <MkA class="_textButton" style="color: var(--MI_THEME-fgOnAccent);" to="/settings/theme">{{ i18n.ts.settings }}</MkA></span>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { themeManager } from '@/theme.js';

function restore() {
	themeManager.clearPreview();
}
</script>

<style lang="scss" module>
.root {
	--height: 24px;
	font-size: 0.85em;
	display: flex;
	vertical-align: bottom;
	width: 100%;
	line-height: var(--height);
	height: var(--height);
	overflow: clip;
	contain: strict;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
}

.icon {
	margin-left: 10px;
	animation: blink 2s infinite;
}

.title {
	padding: 0 10px;
	font-weight: bold;
}

.body {
	min-width: 0;
	flex: 1;
	overflow: clip;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
