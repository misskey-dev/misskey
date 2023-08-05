<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkPagination ref="paginationEl" v-slot="{items}" :pagination="pagination" class="ruryvtyk _gaps_m">
			<section v-for="announcement in items" :key="announcement.id" class="announcement _panel">
				<div class="header"><span v-if="$i && !announcement.isRead">🆕 </span>{{ announcement.title }}</div>
				<div class="content">
					<Mfm :text="announcement.text"/>
					<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
				</div>
				<div v-if="$i && !announcement.isRead" class="footer">
					<MkButton primary @click="read(announcement.id)"><i class="ti ti-check"></i> {{ i18n.ts.gotIt }}</MkButton>
				</div>
			</section>
		</MkPagination>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';

const pagination = {
	endpoint: 'announcements' as const,
	limit: 10,
};

const paginationEl = ref<InstanceType<typeof MkPagination>>();

function read(id: string) {
	if (!paginationEl.value) return;
	paginationEl.value.updateItem(id, announcement => {
		announcement.isRead = true;
		return announcement;
	});
	os.api('i/read-announcement', { announcementId: id });
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
});
</script>

<style lang="scss" scoped>
.ruryvtyk {
	> .announcement {
		padding: 16px;

		> .header {
			margin-bottom: 16px;
			font-weight: bold;
		}

		> .content {
			> img {
				display: block;
				max-height: 300px;
				max-width: 100%;
			}
		}

		> .footer {
			margin-top: 16px;
		}
	}
}
</style>
