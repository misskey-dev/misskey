<template>
<span class="mk-acct">
	<span class="name">@{{ user.username }}</span>
	<span v-if="user.host || detail || $store.state.showFullAcct" class="host">@{{ user.host || host }}</span>
</span>
</template>

<script lang="ts" setup>
import * as misskey from 'misskey-js';
import { toUnicode } from 'punycode/';
import { host as hostRaw } from '@/config';

defineProps<{
	user: misskey.entities.UserDetailed;
	detail?: boolean;
}>();

const host = toUnicode(hostRaw);
</script>

<style lang="scss" scoped>
.mk-acct {
	> .host {
		opacity: 0.5;
	}
}
</style>
