<template>
<MkSpacer :content-max="800" style="padding-top: 0">
	<MkStickyContainer>
		<template #header>
			<MkTab v-model="include" :class="$style.tab">
				<option value="upcoming">{{ i18n.ts.upcomingEvents || 'Upcoming' }}</option>
				<option :value="null">{{ i18n.ts.events || 'Events' }}</option>
			</MkTab>
		</template>
		<MkNotes :no-gap="true" :pagination="pagination" :class="$style.tl" :get-date="include === 'upcoming' ? note => note.event.start : undefined "/>
	</MkStickyContainer>
</MkSpacer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as misskey from 'misskey-js';
import MkNotes from '@/components/MkNotes.vue';
import MkTab from '@/components/MkTab.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
}>();

const include = ref<string | null>('upcoming');

const pagination = {
	endpoint: 'notes/events/search' as const,
	limit: 10,
	params: computed(() => ({
		users: [props.user.id],
		sortBy: include.value === 'upcoming' ? 'startDate' : 'createdAt',
	})),
};
</script>

<style lang="scss" module>
.tab {
	margin: calc(var(--margin) / 2) 0;
	padding: calc(var(--margin) / 2) 0;
	background: var(--bg);
}

.tl {
	background: var(--bg);
    border-radius: var(--radius);
    overflow: clip;
}
</style>
