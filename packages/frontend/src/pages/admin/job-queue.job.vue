<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #label>
		<span v-if="job.opts.repeat != null" style="margin-right: 1em;">&lt;repeat&gt;</span>
		<span v-else style="margin-right: 1em;">#{{ job.id }}</span>
		<span>{{ job.name }}</span>
	</template>
	<template #suffix>
		<MkTime :time="job.finishedOn ?? job.processedOn ?? job.timestamp" mode="relative"/>
		<span v-if="job.progress != null && job.progress > 0" style="margin-left: 1em;">{{ Math.floor(job.progress * 100) }}%</span>
		<span v-if="job.opts.attempts != null && job.opts.attempts > 0 && job.attempts > 1" style="margin-left: 1em; color: var(--MI_THEME-warn); font-variant-numeric: diagonal-fractions;">{{ job.attempts }}/{{ job.opts.attempts }}</span>
		<span v-if="job.isFailed && job.finishedOn != null" style="margin-left: 1em; color: var(--MI_THEME-error)"><i class="ti ti-circle-x"></i></span>
		<span v-else-if="job.isFailed" style="margin-left: 1em; color: var(--MI_THEME-warn)"><i class="ti ti-alert-triangle"></i></span>
		<span v-else-if="job.finishedOn != null" style="margin-left: 1em; color: var(--MI_THEME-success)"><i class="ti ti-check"></i></span>
		<span v-else-if="job.delay != null && job.delay != 0" style="margin-left: 1em;"><i class="ti ti-clock"></i></span>
		<span v-else-if="job.processedOn != null" style="margin-left: 1em; color: var(--MI_THEME-success)"><i class="ti ti-player-play"></i></span>
	</template>
	<template #header>
		<MkTabs
			v-model:tab="tab"
			:tabs="[{
					key: 'info',
					title: 'Info',
					icon: 'ti ti-info-circle',
				}, {
					key: 'timeline',
					title: 'Timeline',
					icon: 'ti ti-timeline-event',
				}, {
					key: 'data',
					title: 'Data',
					icon: 'ti ti-package',
				}, ...(canEdit ? [{
					key: 'dataEdit',
					title: 'Data (edit)',
					icon: 'ti ti-package',
				}] : []),
				...(job.returnValue != null ? [{
					key: 'result',
					title: 'Result',
					icon: 'ti ti-check',
				}] : []),
				...(job.stacktrace.length > 0 ? [{
					key: 'error',
					title: 'Error',
					icon: 'ti ti-alert-triangle',
				}] : [])]"
		/>
	</template>
	<template #footer>
		<div class="_buttons">
			<MkButton rounded @click="copyRaw()"><i class="ti ti-copy"></i> Copy raw</MkButton>
			<MkButton rounded @click="promoteJob()"><i class="ti ti-player-track-next"></i> Promote</MkButton>
			<MkButton danger rounded @click="removeJob()"><i class="ti ti-trash"></i> Remove</MkButton>
		</div>
	</template>

	<div v-if="tab === 'info'" class="_gaps_s">
		<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px;">
			<MkKeyValue>
				<template #key>ID</template>
				<template #value>{{ job.id }}</template>
			</MkKeyValue>
			<MkKeyValue>
				<template #key>Created at</template>
				<template #value><MkTime :time="job.timestamp" mode="detail"/></template>
			</MkKeyValue>
			<MkKeyValue v-if="job.processedOn != null">
				<template #key>Processed at</template>
				<template #value><MkTime :time="job.processedOn" mode="detail"/></template>
			</MkKeyValue>
			<MkKeyValue v-if="job.finishedOn != null">
				<template #key>Finished at</template>
				<template #value><MkTime :time="job.finishedOn" mode="detail"/></template>
			</MkKeyValue>
			<MkKeyValue v-if="job.processedOn != null && job.finishedOn != null">
				<template #key>Spent</template>
				<template #value>{{ job.finishedOn - job.processedOn }}ms</template>
			</MkKeyValue>
			<MkKeyValue v-if="job.failedReason != null">
				<template #key>Failed reason</template>
				<template #value><i style="color: var(--MI_THEME-error)" class="ti ti-alert-triangle"></i> {{ job.failedReason }}</template>
			</MkKeyValue>
			<MkKeyValue v-if="job.opts.attempts != null && job.opts.attempts > 0">
				<template #key>Attempts</template>
				<template #value>{{ job.attempts }} of {{ job.opts.attempts }}</template>
			</MkKeyValue>
			<MkKeyValue v-if="job.progress != null && job.progress > 0">
				<template #key>Progress</template>
				<template #value>{{ Math.floor(job.progress * 100) }}%</template>
			</MkKeyValue>
		</div>
	</div>
	<div v-else-if="tab === 'timeline'">
		<MkTl :events="timeline">
			<template #left="{ event }">
				<div>
					<template v-if="event.type === 'finished'">
						<template v-if="job.isFailed">
							<b>Finished</b> <i class="ti ti-alert-triangle"></i>
						</template>
						<template v-else>
							<b>Finished</b> <i class="ti ti-check"></i>
						</template>
					</template>
					<template v-else-if="event.type === 'processed'">
						<b>Processed</b> <i class="ti ti-player-play"></i>
					</template>
					<template v-else-if="event.type === 'created'">
						<b>Created</b> <i class="ti ti-plus"></i>
					</template>
				</div>
			</template>
			<template #right="{ timestamp, delta }">
				<div>at <MkTime :time="timestamp" mode="detail"/></div>
				<div style="font-size: 90%; opacity: 0.7;">{{ timestamp }} (+{{ msSMH(delta) }})</div>
			</template>
		</MkTl>
	</div>
	<div v-else-if="tab === 'data'">
		<MkCode :code="JSON5.stringify(job.data, null, '\t')" lang="js"/>
	</div>
	<div v-else-if="tab === 'dataEdit'" class="_gaps_s">
		<MkCodeEditor v-model="editData" lang="json5"></MkCodeEditor>
		<MkButton><i class="ti ti-device-floppy"></i> Update</MkButton>
	</div>
	<div v-else-if="tab === 'result'">
		<MkCode :code="job.returnValue"/>
	</div>
	<div v-else-if="tab === 'error'">
		<MkCode v-for="log in job.stacktrace" :code="log" lang="stacktrace"/>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import JSON5 from 'json5';
import type { Ref } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkTabs from '@/components/MkTabs.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkCode from '@/components/MkCode.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkCodeEditor from '@/components/MkCodeEditor.vue';
import MkTl from '@/components/MkTl.vue';
import kmg from '@/filters/kmg.js';
import bytes from '@/filters/bytes.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';

function msSMH(v: number | null) {
	if (v == null) return 'N/A';
	if (v === 0) return '0';
	const suffixes = ['ms', 's', 'm', 'h'];
	const isMinus = v < 0;
	if (isMinus) v = -v;
	const i = Math.floor(Math.log(v) / Math.log(1000));
	const value = v / Math.pow(1000, i);
	const suffix = suffixes[i];
	return `${isMinus ? '-' : ''}${value.toFixed(1)}${suffix}`;
}

const props = defineProps<{
	job: any;
	queueType: string;
}>();

const tab = ref('info');
const editData = ref(JSON5.stringify(props.job.data, null, '\t'));
const canEdit = true;
const timeline = computed(() => {
	const events = [{
		id: 'created',
		timestamp: props.job.timestamp,
		data: {
			type: 'created',
		},
	}];
	if (props.job.processedOn != null) {
		events.push({
			id: 'processed',
			timestamp: props.job.processedOn,
			data: {
				type: 'processed',
			},
		});
	}
	if (props.job.finishedOn != null) {
		events.push({
			id: 'finished',
			timestamp: props.job.finishedOn,
			data: {
				type: 'finished',
			},
		});
	}
	return events;
});

async function promoteJob() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts.areYouSure,
	});
	if (canceled) return;

	os.apiWithDialog('admin/queue/retry-job', { queue: props.queueType, jobId: props.job.id });
}

async function removeJob() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts.areYouSure,
	});
	if (canceled) return;

	os.apiWithDialog('admin/queue/remove-job', { queue: props.queueType, jobId: props.job.id });
}

function copyRaw() {
	const raw = JSON.stringify(props.job, null, '\t');
	copyToClipboard(raw);
}
</script>

<style lang="scss" module>

</style>
