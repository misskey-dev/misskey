<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root"><i class="ti ti-alert-triangle" style="margin-right: 8px;"></i>{{ cautionMessage }}</div>
</template>

<script lang="ts" setup>

defineProps<{
	cautionMessage: string;
}>();
</script>

<style lang="scss" module>
.root {
	font-size: 0.8em;
	padding: 8px 12px;
	margin-top: 10px;
	margin-bottom: 10px;
	background: var(--infoWarnBg);
	color: var(--error);
	border-radius: var(--radius);
	overflow: clip;
}

.link {
	margin-left: 4px;
	color: var(--accent);
}
</style>
