<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="800">
		<MkPagination v-slot="{items}" :pagination="pagination" class="ruryvtyk _content">
			<section v-for="(announcement, i) in items" :key="announcement.id" class="_card announcement">
				<div class="_title"><span v-if="$i && !announcement.isRead">🆕 </span>{{ announcement.title }}</div>
				<div class="_content">
					<Mfm :text="announcement.text"/>
					<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
				</div>
				<div v-if="$i && !announcement.isRead" class="_footer">
					<MkButton primary @click="read(items, announcement, i)"><i class="fas fa-check"></i> {{ $ts.gotIt }}</MkButton>
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
	icon: 'fas fa-broadcast-tower',
});
</script>

<style lang="scss" scoped>
.ruryvtyk {
	> .announcement {
		&:not(:last-child) {
			margin-bottom: var(--margin);
		}

		> ._content {
			> img {
				display: block;
				max-height: 300px;
				max-width: 100%;
			}
		}
	}
}
</style>
