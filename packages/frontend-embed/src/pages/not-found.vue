<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div class="_fullinfo">
		<img :src="notFoundImageUrl" class="_ghost"/>
		<div>{{ i18n.ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { inject, computed } from 'vue';
import { DEFAULT_NOT_FOUND_IMAGE_URL } from '@@/js/const.js';
import { DI } from '@/di.js';
import { i18n } from '@/i18n.js';

const serverMetadata = inject(DI.serverMetadata)!;

const notFoundImageUrl = computed(() => serverMetadata?.notFoundImageUrl ?? DEFAULT_NOT_FOUND_IMAGE_URL);
</script>
