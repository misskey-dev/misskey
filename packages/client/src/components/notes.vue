<template>
<MkPagination ref="pagingComponent" :pagination="pagination">
	<template #empty>
		<div class="_fullinfo">
			<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
			<div>{{ i18n.ts.noNotes }}</div>
		</div>
	</template>

	<template #default="{ items: notes }">
		<div class="giivymft" :class="{ noGap }">
			<XList ref="notes" v-slot="{ item: note }" :items="notes" :direction="pagination.reversed ? 'up' : 'down'" :reversed="pagination.reversed" :no-gap="noGap" :ad="true" class="notes">
				<XNote :key="note._featuredId_ || note._prId_ || note.id" class="qtqtichx" :note="note"/>
			</XList>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import XNote from '@/components/note.vue';
import XList from '@/components/date-separated-list.vue';
import MkPagination, { Paging } from '@/components/ui/pagination.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	pagination: Paging;
	noGap?: boolean;
}>();

const pagingComponent = ref<InstanceType<typeof MkPagination>>();

defineExpose({
	pagingComponent,
});
</script>

<style lang="scss" scoped>
.giivymft {
	&.noGap {
		> .notes {
			background: var(--panel);
		}
	}

	&:not(.noGap) {
		> .notes {
			background: var(--bg);

			.qtqtichx {
				background: var(--panel);
				border-radius: var(--radius);
			}
		}
	}
}
</style>
