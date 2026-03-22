<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.panel">
	<div :class="$style.header">
		<i class="ti ti-calendar-event"></i>
		<span>イベント</span>
		<button :class="$style.closeBtn" @click="$emit('close')">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div :class="$style.content">
		<!-- Event list view -->
		<div v-if="mode === 'list'" :class="$style.listView">
			<div v-if="loading" :class="$style.loading">
				<MkLoading/>
			</div>
			<div v-else-if="events.length === 0" :class="$style.empty">
				開催中のイベントはありません
			</div>
			<div v-else :class="$style.eventList">
				<div
					v-for="event in events"
					:key="event.id"
					:class="[$style.eventCard, $style[event.status]]"
					@click="viewEvent(event)"
				>
					<div v-if="event.bannerUrl" :class="$style.eventBanner">
						<img :src="event.bannerUrl" alt="" />
					</div>
					<div :class="$style.eventInfo">
						<div :class="$style.eventHeader">
							<span :class="$style.eventType">
								<i :class="getEventTypeIcon(event.eventType)"></i>
								{{ getEventTypeName(event.eventType) }}
							</span>
							<span :class="[$style.eventStatus, $style[event.status]]">
								{{ getStatusName(event.status) }}
							</span>
						</div>
						<div :class="$style.eventName">{{ event.name }}</div>
						<div :class="$style.eventPeriod">
							<i class="ti ti-clock"></i>
							{{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}
						</div>
						<div v-if="event.isParticipating" :class="$style.eventProgress">
							<div :class="$style.progressBar">
								<div
									:class="$style.progressFill"
									:style="{ width: `${Math.min((event.currentPoints / event.requiredPoints) * 100, 100)}%` }"
								></div>
							</div>
							<span :class="$style.progressText">
								{{ event.currentPoints }} / {{ event.requiredPoints }}
							</span>
						</div>
						<div v-else :class="$style.joinHint">
							<i class="ti ti-player-play"></i> 参加する
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Event detail view -->
		<div v-else-if="mode === 'detail' && selectedEvent" :class="$style.detailView">
			<div :class="$style.backBtn" @click="mode = 'list'">
				<i class="ti ti-arrow-left"></i>
				<span>戻る</span>
			</div>

			<div v-if="selectedEvent.bannerUrl" :class="$style.detailBanner">
				<img :src="selectedEvent.bannerUrl" alt="" />
			</div>

			<div :class="$style.detailHeader">
				<div :class="$style.eventName">{{ selectedEvent.name }}</div>
				<div :class="[$style.eventStatus, $style[selectedEvent.status]]">
					{{ getStatusName(selectedEvent.status) }}
				</div>
			</div>

			<div v-if="selectedEvent.description" :class="$style.detailDescription">
				{{ selectedEvent.description }}
			</div>

			<div :class="$style.detailPeriod">
				<i class="ti ti-clock"></i>
				{{ formatDate(selectedEvent.startDate) }} - {{ formatDate(selectedEvent.endDate) }}
			</div>

			<!-- Not participating -->
			<div v-if="!participation" :class="$style.joinSection">
				<MkButton primary @click="joinEvent" :disabled="joining || selectedEvent.status !== 'active'">
					<i class="ti ti-player-play"></i> イベントに参加
				</MkButton>
			</div>

			<!-- Participating -->
			<div v-else :class="$style.progressSection">
				<div :class="$style.progressHeader">
					<span>進捗</span>
					<span>{{ participation.points }} / {{ selectedEvent.requiredPoints }}</span>
				</div>
				<div :class="$style.progressBarLarge">
					<div
						:class="$style.progressFill"
						:style="{ width: `${Math.min((participation.points / selectedEvent.requiredPoints) * 100, 100)}%` }"
					></div>
				</div>

				<!-- Rewards -->
				<div :class="$style.rewardsSection">
					<div :class="$style.rewardsHeader">報酬</div>
					<div :class="$style.rewardsList">
						<div
							v-for="reward in rewards"
							:key="reward.id"
							:class="[$style.rewardItem, { [$style.claimed]: reward.claimed, [$style.canClaim]: reward.canClaim }]"
						>
							<div :class="$style.rewardInfo">
								<div :class="$style.rewardName">{{ reward.name }}</div>
								<div :class="$style.rewardRequirement">
									<i class="ti ti-star"></i> {{ reward.requiredPoints }}pt
								</div>
							</div>
							<div :class="$style.rewardAction">
								<button
									v-if="reward.canClaim"
									:class="$style.claimBtn"
									@click="claimReward(reward.id)"
									:disabled="claiming"
								>
									受取
								</button>
								<span v-else-if="reward.claimed" :class="$style.claimedBadge">
									<i class="ti ti-check"></i>
								</span>
								<span v-else :class="$style.lockedBadge">
									<i class="ti ti-lock"></i>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkButton from '@/components/MkButton.vue';

interface Event {
	id: string;
	name: string;
	description: string | null;
	eventType: string;
	bannerUrl: string | null;
	startDate: string;
	endDate: string;
	requiredPoints: number;
	isParticipating: boolean;
	currentPoints: number;
	status: string;
}

interface Participation {
	points: number;
	claimedRewards: string[];
	completedMilestones: number[];
}

interface Reward {
	id: string;
	name: string;
	description: string | null;
	requiredPoints: number;
	rewardType: string;
	canClaim: boolean;
	claimed: boolean;
}

const emit = defineEmits<{
	(e: 'close'): void;
	(e: 'rewardClaimed', rewardId: string): void;
}>();

const mode = ref<'list' | 'detail'>('list');
const loading = ref(false);
const joining = ref(false);
const claiming = ref(false);

const events = ref<Event[]>([]);
const selectedEvent = ref<Event | null>(null);
const participation = ref<Participation | null>(null);
const rewards = ref<Reward[]>([]);

function getToken(): string | null {
	const account = localStorage.getItem('account');
	if (!account) return null;
	try {
		return JSON.parse(account).token;
	} catch {
		return null;
	}
}

function getEventTypeIcon(type: string): string {
	switch (type) {
		case 'seasonal': return 'ti ti-sun';
		case 'holiday': return 'ti ti-gift';
		case 'limited': return 'ti ti-clock';
		case 'ranking': return 'ti ti-trophy';
		case 'collection': return 'ti ti-collection';
		case 'community': return 'ti ti-users';
		default: return 'ti ti-calendar-event';
	}
}

function getEventTypeName(type: string): string {
	switch (type) {
		case 'seasonal': return '季節';
		case 'holiday': return '祝日';
		case 'limited': return '期間限定';
		case 'ranking': return 'ランキング';
		case 'collection': return '収集';
		case 'community': return 'コミュニティ';
		default: return 'イベント';
	}
}

function getStatusName(status: string): string {
	switch (status) {
		case 'active': return '開催中';
		case 'upcoming': return '開催予定';
		case 'ended': return '終了';
		default: return '';
	}
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return `${date.getMonth() + 1}/${date.getDate()}`;
}

async function fetchEvents(): Promise<void> {
	try {
		loading.value = true;
		const res = await window.fetch('/api/noctown/event/list', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken(), includeFuture: true }),
		});

		if (res.ok) {
			const data = await res.json();
			events.value = data.events ?? [];
		}
	} catch (e) {
		console.error('Failed to fetch events:', e);
	} finally {
		loading.value = false;
	}
}

async function viewEvent(event: Event): Promise<void> {
	selectedEvent.value = event;

	if (event.isParticipating) {
		await fetchProgress(event.id);
	} else {
		participation.value = null;
		rewards.value = [];
	}

	mode.value = 'detail';
}

async function fetchProgress(eventId: string): Promise<void> {
	try {
		const res = await window.fetch('/api/noctown/event/progress', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken(), eventId }),
		});

		if (res.ok) {
			const data = await res.json();
			participation.value = data.participation;
			rewards.value = data.rewards ?? [];
		}
	} catch (e) {
		console.error('Failed to fetch progress:', e);
	}
}

async function joinEvent(): Promise<void> {
	if (!selectedEvent.value || joining.value) return;

	try {
		joining.value = true;
		const res = await window.fetch('/api/noctown/event/join', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({ i: getToken(), eventId: selectedEvent.value.id }),
		});

		if (res.ok) {
			selectedEvent.value.isParticipating = true;
			await fetchProgress(selectedEvent.value.id);
			await fetchEvents();
		} else {
			const error = await res.json();
			console.error('Failed to join event:', error);
		}
	} catch (e) {
		console.error('Failed to join event:', e);
	} finally {
		joining.value = false;
	}
}

async function claimReward(rewardId: string): Promise<void> {
	if (!selectedEvent.value || claiming.value) return;

	try {
		claiming.value = true;
		const res = await window.fetch('/api/noctown/event/claim-reward', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'same-origin',
			body: JSON.stringify({
				i: getToken(),
				eventId: selectedEvent.value.id,
				rewardId,
			}),
		});

		if (res.ok) {
			emit('rewardClaimed', rewardId);
			await fetchProgress(selectedEvent.value.id);
		} else {
			const error = await res.json();
			console.error('Failed to claim reward:', error);
		}
	} catch (e) {
		console.error('Failed to claim reward:', e);
	} finally {
		claiming.value = false;
	}
}

onMounted(() => {
	fetchEvents();
});

defineExpose({
	refresh: fetchEvents,
});
</script>

<style lang="scss" module>
.panel {
	position: absolute;
	left: 16px;
	top: 60px;
	width: 360px;
	max-height: 520px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	display: flex;
	flex-direction: column;
	z-index: 100;
}

.header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);
	font-weight: bold;
}

.closeBtn {
	margin-left: auto;
	background: none;
	border: none;
	color: var(--MI_THEME-fg);
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 12px;
}

.loading, .empty {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 100px;
	color: var(--MI_THEME-fg);
	opacity: 0.6;
}

.eventList {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.eventCard {
	border-radius: 10px;
	background: var(--MI_THEME-bg);
	overflow: hidden;
	cursor: pointer;
	transition: transform 0.15s, box-shadow 0.15s;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	&.ended {
		opacity: 0.6;
	}
}

.eventBanner {
	width: 100%;
	height: 80px;
	overflow: hidden;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.eventInfo {
	padding: 12px;
}

.eventHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 6px;
}

.eventType {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	opacity: 0.7;
}

.eventStatus {
	font-size: 10px;
	padding: 2px 8px;
	border-radius: 10px;
	font-weight: 500;

	&.active {
		background: #4caf50;
		color: white;
	}

	&.upcoming {
		background: #2196f3;
		color: white;
	}

	&.ended {
		background: #9e9e9e;
		color: white;
	}
}

.eventName {
	font-size: 15px;
	font-weight: 600;
	margin-bottom: 6px;
}

.eventPeriod {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	opacity: 0.7;
	margin-bottom: 8px;
}

.eventProgress {
	display: flex;
	align-items: center;
	gap: 8px;
}

.progressBar {
	flex: 1;
	height: 6px;
	background: var(--MI_THEME-panel);
	border-radius: 3px;
	overflow: hidden;
}

.progressBarLarge {
	height: 12px;
	background: var(--MI_THEME-bg);
	border-radius: 6px;
	overflow: hidden;
	margin-bottom: 16px;
}

.progressFill {
	height: 100%;
	background: linear-gradient(90deg, #4caf50, #8bc34a);
	border-radius: inherit;
	transition: width 0.3s ease;
}

.progressText {
	font-size: 11px;
	font-weight: 500;
	white-space: nowrap;
}

.joinHint {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
	color: var(--MI_THEME-accent);
}

.backBtn {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 0;
	color: var(--MI_THEME-accent);
	cursor: pointer;
	font-size: 13px;

	&:hover {
		text-decoration: underline;
	}
}

.detailBanner {
	width: 100%;
	height: 120px;
	border-radius: 8px;
	overflow: hidden;
	margin-bottom: 12px;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.detailHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
}

.detailDescription {
	font-size: 13px;
	line-height: 1.5;
	opacity: 0.8;
	margin-bottom: 12px;
}

.detailPeriod {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	opacity: 0.7;
	margin-bottom: 16px;
}

.joinSection {
	text-align: center;
	padding: 20px 0;
}

.progressSection {
	background: var(--MI_THEME-bg);
	border-radius: 8px;
	padding: 16px;
}

.progressHeader {
	display: flex;
	justify-content: space-between;
	font-size: 13px;
	margin-bottom: 8px;
}

.rewardsSection {
	margin-top: 16px;
}

.rewardsHeader {
	font-size: 13px;
	font-weight: 600;
	margin-bottom: 10px;
}

.rewardsList {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.rewardItem {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	background: var(--MI_THEME-panel);
	border-radius: 6px;
	border: 1px solid transparent;

	&.canClaim {
		border-color: #4caf50;
		background: rgba(76, 175, 80, 0.1);
	}

	&.claimed {
		opacity: 0.6;
	}
}

.rewardInfo {
	flex: 1;
}

.rewardName {
	font-size: 13px;
	font-weight: 500;
}

.rewardRequirement {
	font-size: 11px;
	opacity: 0.7;
	display: flex;
	align-items: center;
	gap: 4px;
}

.rewardAction {
	margin-left: 12px;
}

.claimBtn {
	padding: 6px 12px;
	background: #4caf50;
	color: white;
	border: none;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;

	&:hover:not(:disabled) {
		background: #43a047;
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.claimedBadge {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: #4caf50;
	color: white;
	font-size: 14px;
}

.lockedBadge {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: var(--MI_THEME-bg);
	color: var(--MI_THEME-fg);
	opacity: 0.4;
	font-size: 14px;
}
</style>
