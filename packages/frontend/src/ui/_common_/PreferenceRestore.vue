<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<span :class="$style.icon">
		<i class="ti ti-info-circle"></i>
	</span>
	<span :class="$style.title">{{ i18n.ts._preferencesBackup.backupFound }}</span>
	<span :class="$style.body"><button class="_textButton" @click="restore">{{ i18n.ts.restore }}</button> | <button class="_textButton" @click="skip">{{ i18n.ts.skip }}</button></span>
</div>
</template>

<script lang="ts" setup>
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import { hideRestoreBackupSuggestion, restoreFromCloudBackup } from '@/preferences/utility.js';

function restore() {
	restoreFromCloudBackup();
}

function skip() {
	hideRestoreBackupSuggestion();
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
	background: var(--MI_THEME-panel);
}

.icon {
	margin-left: 10px;
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
