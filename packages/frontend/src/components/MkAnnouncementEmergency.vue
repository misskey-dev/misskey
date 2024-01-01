<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, (isModal && $style.modal)]">
	<div :class="[$style.header, $style.content]">
		<span v-if="$i && !announcement.silence && !announcement.isRead" style="margin-right: 0.5em;">🆕</span>
		<span style="margin-right: 0.5em;">
			<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
			<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--warn);"></i>
			<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--error);"></i>
			<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--success);"></i>
		</span>
		<span>{{ emergencyTitle(announcement) }}</span>
	</div>
	<div :class="$style.content">
		<Mfm :text="emergencyBody(announcement)"/>
		<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
		<div style="opacity: 0.7; font-size: 85%;">
			<MkTime :time="announcement.updatedAt ?? announcement.createdAt" mode="detail"/>
		</div>
		<div :class="$style.misskeyInEmergency" class="_gaps_s">
			<div :class="$style.header">
				<i class="ti ti-info-circle" style="margin-right: .5em;"></i>
				<span>{{ i18n.ts._emergencyAnnouncement._misskeyInEmergency.title }}</span>
			</div>
			<div>{{ i18n.ts._emergencyAnnouncement._misskeyInEmergency.description }}</div>
			<div>
				<div :class="$style.smallHeader">{{ i18n.ts._emergencyAnnouncement._misskeyInEmergency._doNotUseMisskey.title }}</div>
				<div>{{ i18n.ts._emergencyAnnouncement._misskeyInEmergency._doNotUseMisskey.description }}</div>
				<MkInfo style="margin-top: 8px;">
					<I18n :src="i18n.ts._emergencyAnnouncement._misskeyInEmergency._doNotUseMisskey.youCanUseCli" tag="div" style="padding: 0 16px;">
						<template #link>
							<a href="/cli" target="_blank" rel="noopener" class="_link _monospace">/cli</a>
						</template>
					</I18n>
				</MkInfo>
			</div>
			<div>
				<div :class="$style.smallHeader">{{ i18n.ts._emergencyAnnouncement._misskeyInEmergency._closeMisskeyCompletely.title }}</div>
				<div>{{ i18n.ts._emergencyAnnouncement._misskeyInEmergency._closeMisskeyCompletely.description }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import { emergencyTitle, emergencyBody } from '@/scripts/emergency-announcements-text.js';
import MkInfo from '@/components/MkInfo.vue';

defineProps<{
	announcement: Misskey.entities.Announcement;
	isModal?: boolean;
}>();
</script>

<style module lang="scss">
.root {
	overflow: hidden;
	position: relative;

	&.modal {
		box-sizing: border-box;
		max-width: 800px;
		margin: 0 auto;
		overflow-y: auto;
	}

	&:before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 6px;
		background-color: #ff2a2a;
	}
}

.header {
	font-weight: bold;
	font-size: 120%;
}

.content {
	padding: 0 16px 16px;

	&:first-child {
		padding-top: 16px;
	}
}

.modal {
	.content {
		padding: 0 32px 16px;

		&:first-child {
			padding-top: 32px;
		}
	}
}

.misskeyInEmergency {
	margin-top: 8px;
	padding: 16px;
	border: .5px solid var(--divider);
	border-radius: var(--radius);
}

.smallHeader {
	font-weight: bold;
	font-size: 110%;
}

</style>
