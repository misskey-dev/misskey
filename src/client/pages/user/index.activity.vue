<template>
<MkContainer>
	<template #header><i class="fas fa-chart-bar" style="margin-right: 0.5em;"></i>{{ $ts.activity }}</template>

	<div style="padding: 8px;">
		<MkChart src="per-user-notes" :args="{ user, withoutAll: true }" span="day" :limit="limit" :stacked="true" :detailed="false" :aspect-ratio="6"/>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@client/os';
import MkContainer from '@client/components/ui/container.vue';
import MkChart from '@client/components/chart.vue';

export default defineComponent({
	components: {
		MkContainer,
		MkChart,
	},
	props: {
		user: {
			type: Object,
			required: true
		},
		limit: {
			type: Number,
			required: false,
			default: 40
		}
	},
});
</script>
