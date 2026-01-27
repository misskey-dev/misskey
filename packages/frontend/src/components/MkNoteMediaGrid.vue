<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<template v-for="file in note.files">
	<div
		v-if="isHiding(file)"
		:class="[$style.filePreview, { [$style.square]: square }]"
		@click="reveal(file)"
	>
		<MkDriveFileThumbnail
			:file="file"
			fit="cover"
			:highlightWhenSensitive="prefer.s.highlightSensitiveMedia"
			:forceBlurhash="true"
			:large="true"
			:class="$style.file"
		/>
		<div :class="$style.sensitive">
			<div>
				<div v-if="file.isSensitive"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ prefer.s.dataSaver.media && file.size ? ` (${bytes(file.size)})` : '' }}</div>
				<div v-else><i class="ti ti-photo"></i> {{ prefer.s.dataSaver.media && file.size ? bytes(file.size) : i18n.ts.image }}</div>
				<div>{{ i18n.ts.clickToShow }}</div>
			</div>
		</div>
	</div>
	<MkA v-else :class="[$style.filePreview, { [$style.square]: square }]" :to="notePage(note)">
		<MkDriveFileThumbnail
			:file="file"
			fit="cover"
			:highlightWhenSensitive="prefer.s.highlightSensitiveMedia"
			:large="true"
			:class="$style.file"
		/>
	</MkA>
</template>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { notePage } from '@/filters/note.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import { shouldHideFileByDefault, canRevealFile } from '@/utility/sensitive-file.js';
import bytes from '@/filters/bytes.js';

import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';

defineProps<{
	note: Misskey.entities.Note;
	square?: boolean;
}>();

const showingFiles = ref<Set<string>>(new Set());

function isHiding(file: Misskey.entities.DriveFile) {
	if (shouldHideFileByDefault(file) && !showingFiles.value.has(file.id)) {
		if (!file.isSensitive && !file.type.startsWith('image/')) {
			return false;
		}
		return true;
	}
	return false;
}

async function reveal(file: Misskey.entities.DriveFile) {
	if (!(await canRevealFile(file))) {
		return;
	}

	showingFiles.value.add(file.id);
}
</script>

<style lang="scss" module>
.square {
	width: 100%;
	height: auto;
	aspect-ratio: 1;
}

.filePreview {
	position: relative;
	height: 128px;
	border-radius: calc(var(--MI-radius) / 2);
	overflow: clip;

	&:hover {
		text-decoration: none;
	}

	&.square {
		height: 100%;
	}
}

.file {
	width: 100%;
	height: 100%;
	border-radius: calc(var(--MI-radius) / 2);
}

.sensitive {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
  place-items: center;
	font-size: 0.8em;
	text-align: center;
	padding: 8px;
	border-radius: calc(var(--MI-radius) / 2);
	box-sizing: border-box;
	color: #fff;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(5px);
	cursor: pointer;
}
</style>
