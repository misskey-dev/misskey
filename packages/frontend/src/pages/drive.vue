<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XDrive ref="drive" :initialFolder="props.folder" @cd="x => folder = x"/>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onDeactivated } from 'vue';
import XDrive from '@/components/MkDrive.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const props = withDefaults(defineProps<{
  folder?: string;
}>(), {
	folder: null,
});

let folder = $ref(null);

// 別のルートから飛んできたらそれはルートディレクトリを開く
let drive = $ref(null);
onActivated(() => {
	if (drive) drive.goRoot();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: folder ? folder.name : i18n.ts.drive,
	icon: 'ti ti-cloud',
	hideHeader: true,
})));
</script>
