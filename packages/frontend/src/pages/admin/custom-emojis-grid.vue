<template>
<div>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader v-model:tab="headerTab" :actions="headerActions" :tabs="headerTabs"/>
		</template>
		<XGridLocalComponent v-if="headerTab === 'local'"/>
		<XGridRemoteComponent v-else/>
	</MkStickyContainer>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import XGridLocalComponent from '@/pages/admin/custom-emojis-grid.local.vue';
import XGridRemoteComponent from '@/pages/admin/custom-emojis-grid.remote.vue';

type PageMode = 'local' | 'remote';

const headerTab = ref<PageMode>('local');

const headerTabs = computed(() => [{
	key: 'local',
	title: i18n.ts.local,
}, {
	key: 'remote',
	title: i18n.ts.remote,
}]);

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.addEmoji,
	handler: () => {
	},
}, {
	icon: 'ti ti-dots',
	text: '',
	handler: () => {
	},
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
})));
</script>

<style lang="scss">
.emoji-grid-row-edited {
	background-color: var(--ag-advanced-filter-column-pill-color);
}

.emoji-grid-item-image {
	width: auto;
	height: 26px;
	max-width: 100%;
	max-height: 100%;
}
</style>

<style module lang="scss">

</style>
