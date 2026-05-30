<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<MkInfo v-if="$i && $i.hasUnreadAnnouncement && tab === 'current'" warn>{{ i18n.ts.youHaveUnreadAnnouncements }}</MkInfo>
			<MkPagination v-slot="{items}" :paginator="paginator" class="_gaps">
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
						<Mfm :text="announcement.text" class="_selectable"/>
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
					<div v-if="tab !== 'past' && $i != null && !announcement.silence && !announcement.isRead" :class="$style.footer">
						<MkButton primary @click="read(announcement)"><i class="ti ti-check"></i> {{ i18n.ts.gotIt }}</MkButton>
					</div>
				</section>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';
import { updateCurrentAccountPartial } from '@/accounts.js';
import { Paginator } from '@/utility/paginator.js';

const paginator = markRaw(new Paginator('announcements', {
	limit: 10,
	computedParams: computed(() => ({
		isActive: tab.value === 'current',
	})),
}));

const tab = ref('current');

async function read(target: Misskey.entities.Announcement) {
	if ($i == null) return;

	if (target.needConfirmationToRead) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts._announcement.readConfirmTitle,
			text: i18n.tsx._announcement.readConfirmText({ title: target.title }),
		});
		if (confirm.canceled) return;
	}

	paginator.updateItem(target.id, a => ({
		...a,
		isRead: true,
	}));
	misskeyApi('i/read-announcement', { announcementId: target.id });
	updateCurrentAccountPartial({
		unreadAnnouncements: $i.unreadAnnouncements.filter(a => a.id !== target.id),
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

definePage(() => ({
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
