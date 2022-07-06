<template>
<span v-if="note.visibility !== 'public'" class="visibility">
	<i v-if="note.visibility === 'home'" class="fas fa-home"></i>
	<i v-else-if="note.visibility === 'followers'" class="fas fa-unlock"></i>
	<i v-else-if="note.visibility === 'specified'" ref="specified" class="fas fa-envelope"></i>
</span>
<span v-if="note.localOnly" class="localOnly"><i class="fas fa-biohazard"></i></span>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import XDetails from '@/components/users-tooltip.vue';
import * as os from '@/os';
import { useTooltip } from '@/scripts/use-tooltip.ts';

const props = defineProps<{
	note: {
		visibility: string;
		localOnly?: boolean;
		visibleUserIds?: string[];
	},
}>();

// Using $ref here breaks the component.
const specified = ref<HTMLElement>();

if (props.note.visibility === 'specified') {
	useTooltip(specified, async (showing) => {
		const users = await os.api('users/show', {
			userIds: props.note.visibleUserIds,
			limit: 10,
		});

		os.popup(XDetails, {
			showing,
			users,
			count: props.note.visibleUserIds.length,
			targetElement: specified.value,
		}, {}, 'closed');
	});
}
</script>

<style lang="scss" scoped>
.visibility, .localOnly {
	margin-left: .3em;
}
</style>
