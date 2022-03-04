<template>
<div v-if="meta">
	<XSetup v-if="meta.requireSetup"/>
	<XEntrance v-else/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XSetup from './welcome.setup.vue';
import XEntrance from './welcome.entrance.a.vue';
import { instanceName } from '@/config';
import * as os from '@/os';
import * as symbols from '@/symbols';

let meta = $ref(null);

os.api('meta', { detail: true }).then(res => {
	meta = res;
});

defineExpose({
	[symbols.PAGE_INFO]: computed(() => ({
		title: instanceName,
		icon: null,
	})),
});
</script>
