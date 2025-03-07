<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<div :key="tab" class="_gaps">
				<MkInfo v-if="$i && $i.hasUnreadAnnouncement && tab === 'current'" warn>{{ i18n.ts.youHaveUnreadAnnouncements }}</MkInfo>
				<MkPagination ref="paginationEl" :key="tab" v-slot="{items}" :pagination="tab === 'current' ? paginationCurrent : paginationPast" class="_gaps">
					<section v-for="announcement in items" :key="announcement.id" class="_panel" :class="$style.announcement">
						<div v-if="announcement.forYou" :class="$style.forYou"><i class="ti ti-pin"></i> {{ i18n.ts.forYou }}</div>
						<div :class="$style.header">
							<span v-if="$i && !announcement.silence && !announcement.isRead" style="margin-right: 0.5em;">🆕</span>
							<span style="margin-right: 0.5em;">
								<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
								<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i>
								<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--MI_THEME-error);"></i>
								<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--MI_THEME-success);"></i>
							</span>
							<MkA :to="`/announcements/${announcement.id}`"><span>{{ announcement.title }}</span></MkA>
						</div>
						<div :class="$style.content">
							<Mfm :text="announcement.text"/>
							<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
							<MkA :to="`/announcements/${announcement.id}`">
								<div style="margin-top: 8px; opacity: 0.7; font-size: 85%;">
									{{ i18n.ts.createdAt }}: <MkTime :time="announcement.createdAt" mode="detail"/>
								</div>
								<div v-if="announcement.updatedAt" style="opacity: 0.7; font-size: 85%;">
									{{ i18n.ts.updatedAt }}: <MkTime :time="announcement.updatedAt" mode="detail"/>
								</div>
							</MkA>
						</div>
						<div v-if="tab !== 'past' && $i && !announcement.silence && !announcement.isRead" :class="$style.footer">
							<MkButton primary @click="read(announcement)"><i class="ti ti-check"></i> {{ i18n.ts.gotIt }}</MkButton>
						</div>
					</section>
				</MkPagination>
			</div>
		</MkHorizontalSwipe>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { $i, updateAccountPartial } from '@/account.js';

const paginationCurrent = {
	endpoint: 'announcements' as const,
	limit: 10,
	params: {
		isActive: true,
	},
};

const paginationPast = {
	endpoint: 'announcements' as const,
	limit: 10,
	params: {
		isActive: false,
	},
};

const paginationEl = ref<InstanceType<typeof MkPagination>>();

const tab = ref('current');

async function read(target) {
	if (target.needConfirmationToRead) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts._announcement.readConfirmTitle,
			text: i18n.tsx._announcement.readConfirmText({ title: target.title }),
		});
		if (confirm.canceled) return;
	}

	if (!paginationEl.value) return;
	paginationEl.value.updateItem(target.id, a => {
		a.isRead = true;
		return a;
	});
	misskeyApi('i/read-announcement', { announcementId: target.id });
	updateAccountPartial({
		unreadAnnouncements: $i!.unreadAnnouncements.filter(a => a.id !== target.id),
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'current',
	title: i18n.ts.currentAnnouncements,
	icon: 'ti ti-flare',
}, {
	key: 'past',
	title: i18n.ts.pastAnnouncements,
	icon: 'ti ti-point',
}]);

definePageMetadata(() => ({
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
}));
</script>

<style lang="scss" module>
.announcement {
	padding: 16px;
}

.forYou {
	display: flex;
	align-items: center;
	line-height: 24px;
	font-size: 90%;
	white-space: pre;
	color: #d28a3f;
}

.header {
	margin-bottom: 16px;
	font-weight: bold;
}

.content {
	> img {
		display: block;
		max-height: 300px;
		max-width: 100%;
	}
}

.footer {
	margin-top: 16px;
}
</style>
