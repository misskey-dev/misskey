<template>
<MkContainer>
	<template #header><i class="fas fa-chart-bar" style="margin-right: 0.5em;"></i>{{ $ts.activity }}</template>

	<div style="padding: 8px;">
		<MkChart src="per-user-notes" :args="{ user, withoutAll: true }" span="day" :limit="limit" :bar="true" :stacked="true" :detailed="false" :aspect-ratio="5"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkContainer from '@/components/ui/container.vue';
import MkChart from '@/components/chart.vue';

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
	limit?: number;
}>(), {
	limit: 50,
});
</script>
