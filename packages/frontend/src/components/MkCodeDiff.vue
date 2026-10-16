<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkCode v-bind="props" />
</template>

<script lang="ts" setup>
import MkCode from '@/components/MkCode.vue';
import type { MkCodeProps } from '@/components/MkCode.vue';
const props = defineProps<MkCodeProps & { diffBase: string }>();
</script>
