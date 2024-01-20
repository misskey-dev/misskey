<template>
<div>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader/>
		</template>
		<MkSpacer :contentMax="900">
			<div class="_gaps">
				<AgGridVue
					:rowData="gridItems"
					:columnDefs="colDefs"
					style="height: 500px"
					class="ag-theme-quartz"
				>
				</AgGridVue>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts">
import { markRaw, onMounted, ref, watch } from 'vue';
import 'ag-grid-community/styles/ag-grid.css'; // Core CSS
import * as Misskey from 'misskey-js';
import { AgGridVue } from 'ag-grid-vue3';
import { ColDef } from 'ag-grid-community';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { GridItem } from '@/pages/admin/custom-emojis-grid.impl.js';
import CustomEmojiGridItem from '@/pages/admin/custom-emojis-grid-item.vue';

// eslint-disable-next-line import/no-default-export
export default {
	components: {
		AgGridVue,
		// eslint-disable-next-line vue/no-unused-components
		CustomEmojiGridItem,
	},
	setup() {
		const colDefs = markRaw<ColDef[]>([
			{ field: 'img', cellRenderer: CustomEmojiGridItem },
			{ field: 'name' },
			{ field: 'category' },
			{ field: 'aliases' },
			{ field: 'license' },
			{ field: 'isSensitive' },
			{ field: 'localOnly' },
			{ field: 'roleIdsThatCanBeUsedThisEmojiAsReaction' },
		]);

		const customEmojis = ref<Misskey.entities.EmojiDetailed[]>([]);
		const gridItems = ref<GridItem[]>([]);

		const refreshCustomEmojis = async () => {
			customEmojis.value = await misskeyApi('emojis', { detail: true }).then(it => it.emojis);
		};

		const refreshGridItems = () => {
			gridItems.value = customEmojis.value.map(it => ({
				id: it.id,
				aliases: it.aliases.join(', '),
				name: it.name,
				category: it.category ?? '',
				license: it.license ?? '',
				isSensitive: it.isSensitive,
				localOnly: it.localOnly,
				roleIdsThatCanBeUsedThisEmojiAsReaction: it.roleIdsThatCanBeUsedThisEmojiAsReaction.join(', '),
				url: it.url,
			}));
		};

		watch(customEmojis, refreshGridItems);

		onMounted(async () => {
			await refreshCustomEmojis();
			refreshGridItems();
		});

		return {
			colDefs,
			customEmojis,
			gridItems,
		};
	},
};
</script>

<style scoped lang="scss">

</style>
