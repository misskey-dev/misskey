<template>
<MkA v-adaptive-bg :to="`/admin/roles/${role.id}`" class="_panel" :class="$style.root" tabindex="-1">
	<div :class="$style.title">{{ role.name }}</div>
	<div :class="$style.description">{{ role.description }}</div>
</MkA>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import * as os from '@/os';

const props = defineProps<{
	role: any;
}>();
</script>

<style lang="scss" module>
.root {
	display: block;
	padding: 16px 20px;
}

.title {
	font-weight: bold;
}

.description {
	opacity: 0.7;
}
</style>
