<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.filePreview, { [$style.bgIsPanel]: bgIsPanel }]">
	<div :class="$style.icon">
		<i v-if="!FILE_TYPE_BROWSERSAFE.includes(file.type)" class="ti ti-file"></i>
		<i v-else-if="file.type.startsWith('video/')" class="ti ti-video"></i>
		<i v-else-if="file.type.startsWith('audio/')" class="ti ti-music"></i>
		<i v-else class="ti ti-file"></i>
	</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';

import { FILE_TYPE_BROWSERSAFE } from '@@/js/const.js';

defineProps<{
	file: Misskey.entities.DriveFile;
	bgIsPanel?: boolean;
}>();
</script>

<style lang="scss" module>
.filePreview {
	background-color: var(--MI_THEME-panel);
	height: 100%;
	border-radius: 6px;
	display: flex;
	align-items: center;

	&.bgIsPanel {
		background-color: var(--MI_THEME-bg);
	}

	> .icon {
		width: 100%;
		text-align: center;
		font-size: 36px;
	}
}
</style>
