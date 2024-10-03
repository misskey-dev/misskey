<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XValue :value="value" :collapsed="false"/>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XValue from './MkObjectView.value.vue';

const props = defineProps<{
	value: Record<string, unknown>;
}>();
</script>
