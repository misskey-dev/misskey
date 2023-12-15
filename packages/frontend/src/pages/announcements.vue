<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div class="_gaps">
			<MkInfo v-if="$i && $i.hasUnreadAnnouncement && tab === 'current'" warn>{{ i18n.ts.youHaveUnreadAnnouncements }}</MkInfo>
			<MkPagination ref="paginationEl" :key="tab" v-slot="{items}" :pagination="tab === 'current' ? paginationCurrent : paginationPast" class="_gaps">
				<section v-for="announcement in items" :key="announcement.id" class="_panel" :class="$style.announcement">
					<div v-if="announcement.forYou" :class="$style.forYou"><i class="ti ti-pin"></i> {{ i18n.ts.forYou }}</div>
					<div :class="$style.header">
						<span v-if="$i && !announcement.silence && !announcement.isRead" style="margin-right: 0.5em;">🆕</span>
						<span style="margin-right: 0.5em;">
							<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
							<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--warn);"></i>
							<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--error);"></i>
							<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--success);"></i>
						</span>
						<span>{{ announcement.title }}</span>
					</div>
					<div :class="$style.content">
						<Mfm :text="announcement.text"/>
						<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
						<div style="opacity: 0.7; font-size: 85%;">
							<MkTime :time="announcement.updatedAt ?? announcement.createdAt" mode="detail"/>
						</div>
					</div>
					<div v-if="tab !== 'past' && $i && !announcement.silence && !announcement.isRead" :class="$style.footer">
						<MkButton primary @click="read(announcement)"><i class="ti ti-check"></i> {{ i18n.ts.gotIt }}</MkButton>
					</div>
				</section>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { $i, updateAccount } from '@/account.js';

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

async function read(announcement) {
	if (announcement.needConfirmationToRead) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts._announcement.readConfirmTitle,
			text: i18n.t('_announcement.readConfirmText', { title: announcement.title }),
		});
		if (confirm.canceled) return;
	}

	if (!paginationEl.value) return;
	paginationEl.value.updateItem(announcement.id, a => {
		a.isRead = true;
		return a;
	});
	os.api('i/read-announcement', { announcementId: announcement.id });
	updateAccount({
		unreadAnnouncements: $i!.unreadAnnouncements.filter(a => a.id !== announcement.id),
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

definePageMetadata({
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
});
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
