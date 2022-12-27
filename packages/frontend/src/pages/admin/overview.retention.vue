<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-else :class="$style.root">
		<div v-for="row in retention" class="row">
			<div v-for="value in getValues(row)" v-tooltip="value.percentage" class="cell">
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as os from '@/os';
import number from '@/filters/number';
import { i18n } from '@/i18n';

let retention: any = $ref(null);
let fetching = $ref(true);

function getValues(row) {
	const data = [];
	for (const key in row.data) {
		data.push({
			date: new Date(key),
			value: number(row.data[key]),
			percentage: `${Math.ceil(row.data[key] / row.users) * 100}%`,
		});
	}
	data.sort((a, b) => a.date > b.date);
	return data;
}

onMounted(async () => {
	retention = await os.apiGet('retention', {});

	fetching = false;
});
</script>

<style lang="scss" module>
.root {

	&:global {

	}
}
</style>
