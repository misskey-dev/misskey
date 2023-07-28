<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkPagination v-slot="{items}" :pagination="pagination" class="ruryvtyk _gaps_m">
			<section v-for="(announcement, i) in items" :key="announcement.id" class="announcement _panel">
				<div class="header"><span v-if="$i && !announcement.isRead">🆕 </span>{{ announcement.title }}</div>
				<div class="content">
					<Mfm :text="announcement.text"/>
					<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
				</div>
				<div v-if="$i && !announcement.isRead" class="footer">
					<MkButton primary @click="read(items, announcement, i)"><i class="ti ti-check"></i> {{ i18n.ts.gotIt }}</MkButton>
				</div>
			</section>
		</MkPagination>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
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

// TODO: これは実質的に親コンポーネントから子コンポーネントのプロパティを変更してるのでなんとかしたい
function read(items, announcement, i) {
	items[i] = {
		...announcement,
		isRead: true,
	};
	os.api('i/read-announcement', { announcementId: announcement.id });
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
