<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>{{ i18n.ts._role._options.uploadableFileTypes_caption }}</div>
<div><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i> {{ i18n.tsx._role._options.uploadableFileTypes_caption2({ x: 'application/octet-stream' }) }}</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
</script>
