<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XDrive ref="drive" :initialFolder="props.folder" @cd="cd"/>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated } from 'vue';
import XDrive from '@/components/MkDrive.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { mainRouter, useRouter } from '@/router.js';

const props = withDefaults(defineProps<{
  folder?: string;
}>(), {
	folder: null,
});

let folder = $ref(null);

let drive = $ref(null);

// 別のルートから飛んできたらそれはルートディレクトリを開く
onActivated(() => {
	if (drive) drive.goRoot();
});

const router = useRouter();

function cd(x) {
	folder = x;
	// メインルーターならURLだけ書き換え
	if (router === mainRouter) {
		if (folder === null) {
			history.pushState({}, '', '/my/drive/');
		} else {
			history.pushState({}, '', `/my/drive/folder/${folder.id}`);
		}
	}
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: folder ? folder.name : i18n.ts.drive,
	icon: 'ti ti-cloud',
	hideHeader: true,
})));
</script>
