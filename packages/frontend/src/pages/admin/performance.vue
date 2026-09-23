<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/performance" :label="i18n.ts.performance" :keywords="['performance']" icon="ti ti-bolt">
			<div class="_gaps">
				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableServerMachineStats" @change="onChange_enableServerMachineStats">
							<template #label><SearchLabel>{{ i18n.ts.enableServerMachineStats }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableIdenticonGeneration" @change="onChange_enableIdenticonGeneration">
							<template #label><SearchLabel>{{ i18n.ts.enableIdenticonGeneration }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableChartsForRemoteUser" @change="onChange_enableChartsForRemoteUser">
							<template #label><SearchLabel>{{ i18n.ts.enableChartsForRemoteUser }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableStatsForFederatedInstances" @change="onChange_enableStatsForFederatedInstances">
							<template #label><SearchLabel>{{ i18n.ts.enableStatsForFederatedInstances }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="enableChartsForFederatedInstances" @change="onChange_enableChartsForFederatedInstances">
							<template #label><SearchLabel>{{ i18n.ts.enableChartsForFederatedInstances }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<div class="_panel" style="padding: 16px;">
						<MkSwitch v-model="showRoleBadgesOfRemoteUsers" @change="onChange_showRoleBadgesOfRemoteUsers">
							<template #label><SearchLabel>{{ i18n.ts.showRoleBadgesOfRemoteUsers }}</SearchLabel></template>
							<template #caption>{{ i18n.ts.turnOffToImprovePerformance }}</template>
						</MkSwitch>
					</div>
				</SearchMarker>

				<SearchMarker>
					<MkFolder :defaultOpen="true">
						<template #icon><SearchIcon><i class="ti ti-bolt"></i></SearchIcon></template>
						<template #label><SearchLabel>Misskey® Fan-out Timeline Technology™ (FTT)</SearchLabel></template>
						<template v-if="fttForm.savedState.enableFanoutTimeline" #suffix>Enabled</template>
						<template v-else #suffix>Disabled</template>
						<template v-if="fttForm.modified.value" #footer>
							<MkFormFooter :form="fttForm"/>
						</template>

						<div class="_gaps">
							<SearchMarker>
								<MkSwitch v-model="fttForm.state.enableFanoutTimeline">
									<template #label><SearchLabel>{{ i18n.ts.enable }}</SearchLabel><span v-if="fttForm.modifiedStates.enableFanoutTimeline" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption>
										<div><SearchText>{{ i18n.ts._serverSettings.fanoutTimelineDescription }}</SearchText></div>
										<div><MkLink target="_blank" url="https://misskey-hub.net/docs/for-admin/features/ftt/">{{ i18n.ts.details }}</MkLink></div>
									</template>
								</MkSwitch>
							</SearchMarker>

							<template v-if="fttForm.state.enableFanoutTimeline">
								<SearchMarker :keywords="['db', 'database', 'fallback']">
									<MkSwitch v-model="fttForm.state.enableFanoutTimelineDbFallback">
										<template #label><SearchLabel>{{ i18n.ts._serverSettings.fanoutTimelineDbFallback }}</SearchLabel><span v-if="fttForm.modifiedStates.enableFanoutTimelineDbFallback" class="_modified">{{ i18n.ts.modified }}</span></template>
										<template #caption><SearchText>{{ i18n.ts._serverSettings.fanoutTimelineDbFallbackDescription }}</SearchText></template>
									</MkSwitch>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="fttForm.state.perLocalUserUserTimelineCacheMax" type="number">
										<template #label><SearchLabel>perLocalUserUserTimelineCacheMax</SearchLabel><span v-if="fttForm.modifiedStates.perLocalUserUserTimelineCacheMax" class="_modified">{{ i18n.ts.modified }}</span></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="fttForm.state.perRemoteUserUserTimelineCacheMax" type="number">
										<template #label><SearchLabel>perRemoteUserUserTimelineCacheMax</SearchLabel><span v-if="fttForm.modifiedStates.perRemoteUserUserTimelineCacheMax" class="_modified">{{ i18n.ts.modified }}</span></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="fttForm.state.perUserHomeTimelineCacheMax" type="number">
										<template #label><SearchLabel>perUserHomeTimelineCacheMax</SearchLabel><span v-if="fttForm.modifiedStates.perUserHomeTimelineCacheMax" class="_modified">{{ i18n.ts.modified }}</span></template>
									</MkInput>
								</SearchMarker>

								<SearchMarker>
									<MkInput v-model="fttForm.state.perUserListTimelineCacheMax" type="number">
										<template #label><SearchLabel>perUserListTimelineCacheMax</SearchLabel><span v-if="fttForm.modifiedStates.perUserListTimelineCacheMax" class="_modified">{{ i18n.ts.modified }}</span></template>
									</MkInput>
								</SearchMarker>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker>
					<MkFolder :defaultOpen="true">
						<template #icon><SearchIcon><i class="ti ti-bolt"></i></SearchIcon></template>
						<template #label><SearchLabel>Misskey® Reactions Boost Technology™ (RBT)</SearchLabel></template>
						<template v-if="rbtForm.savedState.enableReactionsBuffering" #suffix>Enabled</template>
						<template v-else #suffix>Disabled</template>
						<template v-if="rbtForm.modified.value" #footer>
							<MkFormFooter :form="rbtForm"/>
						</template>

						<div class="_gaps_m">
							<SearchMarker>
								<MkSwitch v-model="rbtForm.state.enableReactionsBuffering">
									<template #label><SearchLabel>{{ i18n.ts.enable }}</SearchLabel><span v-if="rbtForm.modifiedStates.enableReactionsBuffering" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #caption><SearchText>{{ i18n.ts._serverSettings.reactionsBufferingDescription }}</SearchText></template>
								</MkSwitch>
							</SearchMarker>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker :keywords="['meilisearch', 'search', 'reindex', 'index']">
					<MkFolder :defaultOpen="false">
						<template #icon><SearchIcon><i class="ti ti-refresh"></i></SearchIcon></template>
						<template #label><SearchLabel>{{ i18n.ts._meilisearchReIndex.title }}</SearchLabel></template>
						<template #suffix>{{ reIndexRunning ? i18n.ts._meilisearchReIndex.statusRunning : i18n.ts._meilisearchReIndex.statusIdle }}</template>

						<div class="_gaps_s">
							<MkInfo><SearchText>{{ i18n.ts._meilisearchReIndex.description }}</SearchText></MkInfo>

							<MkFolder :defaultOpen="false">
								<template #label>{{ i18n.ts._meilisearchReIndex.advanced }}</template>
								<div class="_gaps_s">
									<MkInput v-model="reIndexSinceDateStr" type="date">
										<template #label>{{ i18n.ts._meilisearchReIndex.sinceDate }}</template>
									</MkInput>
									<MkInput v-model="reIndexUntilDateStr" type="date">
										<template #label>{{ i18n.ts._meilisearchReIndex.untilDate }}</template>
									</MkInput>
								</div>
							</MkFolder>

							<div class="_buttons">
								<MkButton primary :disabled="reIndexRunning" @click="startReIndex">
									<i class="ti ti-refresh"></i> {{ i18n.ts._meilisearchReIndex.start }}
								</MkButton>
								<MkButton @click="openJobQueue">
									<i class="ti ti-external-link"></i> {{ i18n.ts._meilisearchReIndex.openJobQueue }}
								</MkButton>
							</div>
						</div>
					</MkFolder>
				</SearchMarker>

				<SearchMarker>
					<MkFolder :defaultOpen="true">
						<template #icon><SearchIcon><i class="ti ti-recycle"></i></SearchIcon></template>
						<template #label><SearchLabel>Remote Notes Cleaning (仮)</SearchLabel></template>
						<template v-if="remoteNotesCleaningForm.savedState.enableRemoteNotesCleaning" #suffix>Enabled</template>
						<template v-else #suffix>Disabled</template>
						<template v-if="remoteNotesCleaningForm.modified.value" #footer>
							<MkFormFooter :form="remoteNotesCleaningForm"/>
						</template>

						<div class="_gaps_m">
							<MkSwitch v-model="remoteNotesCleaningForm.state.enableRemoteNotesCleaning">
								<template #label><SearchLabel>{{ i18n.ts.enable }}</SearchLabel><span v-if="remoteNotesCleaningForm.modifiedStates.enableRemoteNotesCleaning" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #caption><SearchText>{{ i18n.ts._serverSettings.remoteNotesCleaning_description }}</SearchText></template>
							</MkSwitch>

							<template v-if="remoteNotesCleaningForm.state.enableRemoteNotesCleaning">
								<MkInput v-model="remoteNotesCleaningForm.state.remoteNotesCleaningExpiryDaysForEachNotes" type="number">
									<template #label><SearchLabel>{{ i18n.ts._serverSettings.remoteNotesCleaningExpiryDaysForEachNotes }}</SearchLabel> ({{ i18n.ts.inDays }})<span v-if="remoteNotesCleaningForm.modifiedStates.remoteNotesCleaningExpiryDaysForEachNotes" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #suffix>{{ i18n.ts._time.day }}</template>
								</MkInput>

								<MkInput v-model="remoteNotesCleaningForm.state.remoteNotesCleaningMaxProcessingDurationInMinutes" type="number">
									<template #label><SearchLabel>{{ i18n.ts._serverSettings.remoteNotesCleaningMaxProcessingDuration }}</SearchLabel> ({{ i18n.ts.inMinutes }})<span v-if="remoteNotesCleaningForm.modifiedStates.remoteNotesCleaningMaxProcessingDurationInMinutes" class="_modified">{{ i18n.ts.modified }}</span></template>
									<template #suffix>{{ i18n.ts._time.minute }}</template>
								</MkInput>
							</template>
						</div>
					</MkFolder>
				</SearchMarker>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { fetchInstance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { useRouter } from '@/router.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInput from '@/components/MkInput.vue';
import MkLink from '@/components/MkLink.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkButton from '@/components/MkButton.vue';
import { useForm } from '@/composables/use-form.js';
import MkFormFooter from '@/components/MkFormFooter.vue';

const meta = await misskeyApi('admin/meta');

const enableServerMachineStats = ref(meta.enableServerMachineStats);
const enableIdenticonGeneration = ref(meta.enableIdenticonGeneration);
const enableChartsForRemoteUser = ref(meta.enableChartsForRemoteUser);
const enableStatsForFederatedInstances = ref(meta.enableStatsForFederatedInstances);
const enableChartsForFederatedInstances = ref(meta.enableChartsForFederatedInstances);
const showRoleBadgesOfRemoteUsers = ref(meta.showRoleBadgesOfRemoteUsers);

function onChange_enableServerMachineStats(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableServerMachineStats: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableIdenticonGeneration(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableIdenticonGeneration: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableChartsForRemoteUser(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableChartsForRemoteUser: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableStatsForFederatedInstances(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableStatsForFederatedInstances: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_enableChartsForFederatedInstances(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		enableChartsForFederatedInstances: value,
	}).then(() => {
		fetchInstance(true);
	});
}

function onChange_showRoleBadgesOfRemoteUsers(value: boolean) {
	os.apiWithDialog('admin/update-meta', {
		showRoleBadgesOfRemoteUsers: value,
	}).then(() => {
		fetchInstance(true);
	});
}

const fttForm = useForm({
	enableFanoutTimeline: meta.enableFanoutTimeline,
	enableFanoutTimelineDbFallback: meta.enableFanoutTimelineDbFallback,
	perLocalUserUserTimelineCacheMax: meta.perLocalUserUserTimelineCacheMax,
	perRemoteUserUserTimelineCacheMax: meta.perRemoteUserUserTimelineCacheMax,
	perUserHomeTimelineCacheMax: meta.perUserHomeTimelineCacheMax,
	perUserListTimelineCacheMax: meta.perUserListTimelineCacheMax,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableFanoutTimeline: state.enableFanoutTimeline,
		enableFanoutTimelineDbFallback: state.enableFanoutTimelineDbFallback,
		perLocalUserUserTimelineCacheMax: state.perLocalUserUserTimelineCacheMax,
		perRemoteUserUserTimelineCacheMax: state.perRemoteUserUserTimelineCacheMax,
		perUserHomeTimelineCacheMax: state.perUserHomeTimelineCacheMax,
		perUserListTimelineCacheMax: state.perUserListTimelineCacheMax,
	});
	fetchInstance(true);
});

const rbtForm = useForm({
	enableReactionsBuffering: meta.enableReactionsBuffering,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableReactionsBuffering: state.enableReactionsBuffering,
	});
	fetchInstance(true);
});

const router = useRouter();

const reIndexSinceDateStr = ref('');
const reIndexUntilDateStr = ref('');
const reIndexRunning = ref(false);
let reIndexPollTimer: ReturnType<typeof setInterval> | null = null;

async function refreshReIndexStatus() {
	try {
		const job = await misskeyApi('admin/queue/show-job', { queue: 'db', jobId: 'reIndexNotes' });
		// QueueJob には state プロパティが無いため、finishedOn / isFailed の有無で「未完了 = 実行中」と判定する
		reIndexRunning.value = job != null && job.finishedOn == null && !job.isFailed;
	} catch {
		reIndexRunning.value = false;
	}
}

function parseDateInput(value: string): number | null {
	if (!value) return null;
	const t = new Date(value).getTime();
	return Number.isFinite(t) ? t : null;
}

async function startReIndex() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts._meilisearchReIndex.confirmTitle,
		text: i18n.ts._meilisearchReIndex.confirmText,
	});
	if (canceled) return;

	try {
		await misskeyApi('admin/search/reindex', {
			sinceDate: parseDateInput(reIndexSinceDateStr.value),
			untilDate: parseDateInput(reIndexUntilDateStr.value),
		});
		reIndexRunning.value = true;
		const { canceled: navCanceled } = await os.confirm({
			type: 'success',
			title: i18n.ts._meilisearchReIndex.startedTitle,
			text: i18n.ts._meilisearchReIndex.startedText,
			okText: i18n.ts._meilisearchReIndex.openJobQueue,
			cancelText: i18n.ts.close,
		});
		if (!navCanceled) openJobQueue();
	} catch (err: any) {
		if (err?.code === 'ALREADY_RUNNING') {
			reIndexRunning.value = true;
			await os.alert({ type: 'warning', text: i18n.ts._meilisearchReIndex.alreadyRunning });
		} else if (err?.code === 'MEILISEARCH_NOT_ACTIVE') {
			await os.alert({ type: 'error', text: i18n.ts._meilisearchReIndex.notActive });
		} else {
			throw err;
		}
	}
}

function openJobQueue() {
	router.push('/admin/job-queue');
}

onMounted(() => {
	refreshReIndexStatus();
	reIndexPollTimer = window.setInterval(refreshReIndexStatus, 10 * 1000);
});
onUnmounted(() => {
	if (reIndexPollTimer != null) window.clearInterval(reIndexPollTimer);
});

const remoteNotesCleaningForm = useForm({
	enableRemoteNotesCleaning: meta.enableRemoteNotesCleaning,
	remoteNotesCleaningExpiryDaysForEachNotes: meta.remoteNotesCleaningExpiryDaysForEachNotes,
	remoteNotesCleaningMaxProcessingDurationInMinutes: meta.remoteNotesCleaningMaxProcessingDurationInMinutes,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableRemoteNotesCleaning: state.enableRemoteNotesCleaning,
		remoteNotesCleaningExpiryDaysForEachNotes: state.remoteNotesCleaningExpiryDaysForEachNotes,
		remoteNotesCleaningMaxProcessingDurationInMinutes: state.remoteNotesCleaningMaxProcessingDurationInMinutes,
	});
	fetchInstance(true);
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.performance,
	icon: 'ti ti-bolt',
}));
</script>
