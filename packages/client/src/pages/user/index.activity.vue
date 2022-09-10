<template>
<MkContainer>
	<template #header><i class="fas fa-chart-simple" style="margin-right: 0.5em;"></i>{{ $ts.activity }}</template>
	<template #func>
		<button class="_button" @click="showMenu">
			<i class="fas fa-ellipsis-h"></i>
		</button>
	</template>

	<div style="padding: 8px;">
		<MkChart :src="chartSrc" :args="{ user, withoutAll: true }" span="day" :limit="limit" :bar="true" :stacked="true" :detailed="false" :aspect-ratio="5"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkContainer from '@/components/MkContainer.vue';
import MkChart from '@/components/MkChart.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
	limit?: number;
}>(), {
	limit: 50,
});

let chartSrc = $ref('per-user-notes');

function showMenu(ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts.notes,
		active: true,
		action: () => {
			chartSrc = 'per-user-notes';
		},
	},/*, {
		text: i18n.ts.following,
		action: () => {
			chartSrc = 'per-user-following';
		}
	}, {
		text: i18n.ts.followers,
		action: () => {
			chartSrc = 'per-user-followers';
		}
	}*/], ev.currentTarget ?? ev.target);
}
</script>
