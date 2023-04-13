<template>
<div :class="$style.root">
	<i class="ti ti-plane-departure" style="margin-right: 8px;"></i>
	{{ i18n.ts.accountMoved }}
	<MkMention :class="$style.link" :username="username" :host="host ?? localHost"/>
</div>
</template>

<script lang="ts" setup>
import MkMention from './MkMention.vue';
import { i18n } from '@/i18n';
import { host as localHost } from '@/config';

defineProps<{
	username: string;
	host: string;
}>();
</script>

<style lang="scss" module>
.root {
	padding: 16px;
	font-size: 90%;
	background: var(--infoWarnBg);
	color: var(--error);
	border-radius: var(--radius);
}

.link {
	margin-left: 4px;
}
</style>
