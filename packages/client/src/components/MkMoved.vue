<template>
<div class="_block" :class="$style.mkmoved"><i class="fas fa-info-circle" style="margin-right: 8px;"></i>{{ i18n.ts.accountMoved }}<MkA :class="$style.link" class="_link" :to="href">{{ acct }}</MkA></div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n';

const props = defineProps<{
	acct: string;
}>();

const href = $computed(() => `/${props.acct}`);
</script>

<style lang="scss" module>
.mkmoved {
	font-size: 0.8em;
	padding: 16px;
	background: var(--infoBg);
	color: var(--infoFg);
}

.link {
	margin-left: 4px;
}
</style>
