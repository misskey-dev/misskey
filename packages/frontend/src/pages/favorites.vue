<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="800">
		<MkPagination :pagination="pagination">
			<template #empty>
				<div class="_fullinfo">
					<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
					<div>{{ i18n.ts.noNotes }}</div>
				</div>
			</template>

			<template #default="{ items }">
				<MkDateSeparatedList v-slot="{ item }" :items="items" :direction="'down'" :no-gap="false" :ad="false">
					<MkNote :key="item.id" :note="item.note" :class="$style.note"/>
				</MkDateSeparatedList>
			</template>
		</MkPagination>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkDateSeparatedList from '@/components/MkDateSeparatedList.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const pagination = {
	endpoint: 'i/favorites' as const,
	limit: 10,
};

definePageMetadata({
	title: i18n.ts.favorites,
	icon: 'ti ti-star',
});
</script>

<style lang="scss" module>
.note {
	background: var(--panel);
	border-radius: var(--radius);
}
</style>
