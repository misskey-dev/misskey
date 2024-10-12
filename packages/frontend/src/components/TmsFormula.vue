<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XFormula :formula="props.formula" :displayMode="props.displayMode"/>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';

const XFormula = defineAsyncComponent(() => import('@/components/TmsFormula.core.vue'));

const props = defineProps<{
	formula: string;
	displayMode: boolean;
}>();
</script>
