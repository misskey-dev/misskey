<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div class="_fullinfo">
		<div>{{ i18n.ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { inject, computed } from 'vue';
import { DI } from '@/di.js';
import { i18n } from '@/i18n.js';

const serverMetadata = inject(DI.serverMetadata)!;
</script>
