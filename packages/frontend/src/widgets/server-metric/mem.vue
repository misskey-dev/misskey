<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="zlxnikvl">
	<XPie class="pie" :value="usage"/>
	<div>
		<p><i class="ti ti-section"></i>RAM</p>
		<p>Total: {{ bytes(total, 1) }}</p>
		<p>Used: {{ bytes(used, 1) }}</p>
		<p>Free: {{ bytes(free, 1) }}</p>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XPie from './pie.vue';
import bytes from '@/filters/bytes.js';

const props = defineProps<{
	connection: any,
	meta: Misskey.entities.ServerInfoResponse
}>();

const usage = ref<number>(0);
const total = ref<number>(0);
const used = ref<number>(0);
const free = ref<number>(0);

function onStats(stats) {
	usage.value = stats.mem.active / props.meta.mem.total;
	total.value = props.meta.mem.total;
	used.value = stats.mem.active;
	free.value = total.value - used.value;
}

onMounted(() => {
	props.connection.on('stats', onStats);
});

onBeforeUnmount(() => {
	props.connection.off('stats', onStats);
});
</script>

<style lang="scss" scoped>
.zlxnikvl {
	display: flex;
	padding: 16px;

	> .pie {
		height: 82px;
		flex-shrink: 0;
		margin-right: 16px;
	}

	> div {
		flex: 1;

		> p {
			margin: 0;
			font-size: 0.8em;

			&:first-child {
				font-weight: bold;
				margin-bottom: 4px;

				> i {
					margin-right: 4px;
				}
			}
		}
	}
}
</style>
