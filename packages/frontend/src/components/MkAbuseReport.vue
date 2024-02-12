<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.target">
		<MkA v-user-preview="report.targetUserId" :class="$style.info" :to="`/admin/user/${report.targetUserId}`">
			<MkAvatar :class="$style.avatar" :user="report.targetUser" indicator/>
			<div :class="$style.name">
				<MkUserName :class="$style.names" :user="report.targetUser"/>
				<MkAcct :class="$style.names" :user="report.targetUser" style="display: block;"/>
			</div>
		</MkA>
		<MkKeyValue>
			<template #key>{{ i18n.ts.registeredDate }}</template>
			<template #value>{{ dateString(report.targetUser.createdAt) }} (<MkTime :time="report.targetUser.createdAt"/>)</template>
		</MkKeyValue>
	</div>
	<div :class="$style.detail">
		<div>
			<Mfm :text="report.comment"/>
			<MkFolder v-if="report.notes.length !== 0" :class="$style.notes">
				<template #label>{{ i18n.ts.reportedNote }}</template>
				<div v-for="note in report.notes" :class="$style.notes">
					<MkNoteSimple v-if="note !== 'deleted'" :note="note"/>
					<div v-else> note is deleted </div>
				</div>
			</MkFolder>
		</div>
		<hr/>
		<div>{{ i18n.ts.reporter }}: <MkA :to="`/admin/user/${report.reporter.id}`" class="_link">@{{ report.reporter.username }}</MkA></div>
		<div v-if="report.assignee">
			{{ i18n.ts.moderator }}:
			<MkAcct :user="report.assignee"/>
		</div>
		<div><MkTime :time="report.createdAt"/></div>
		<div class="action">
			<MkSwitch v-model="forward" :disabled="report.targetUser.host == null || report.resolved">
				{{ i18n.ts.forwardReport }}
				<template #caption>{{ i18n.ts.forwardReportIsAnonymous }}</template>
			</MkSwitch>
			<MkButton v-if="!report.resolved" primary @click="resolve">{{ i18n.ts.abuseMarkAsResolved }}</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { dateString } from '@/filters/date.js';
import MkFolder from '@/components/MkFolder.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
const props = defineProps<{
	report: {
    id: string;
    createdAt:string;
    targetUserId:Misskey.entities.User['id'];
    targetUser:Misskey.entities.User & { createdAt:string; };
    reporter:Misskey.entities.User;
    assignee:Misskey.entities.User['id'];
    comment:string;
    notes:Misskey.entities.Note['id'][];
    forwarded:boolean;
    resolved:boolean;
  };
}>();

const emit = defineEmits<{
	(ev: 'resolved', reportId: string): void;
}>();

const forward = ref(props.report.forwarded);

function resolve() {
	os.apiWithDialog('admin/resolve-abuse-user-report', {
		forward: forward.value,
		reportId: props.report.id,
	}).then(() => {
		emit('resolved', props.report.id);
	});
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	margin: var(--margin) 0;
	background: var(--panel);
	border-radius: var(--radius);
	overflow: clip;
}

.notes {
	margin: var(--margin) 0;
	padding: 0;
}

.target {
	width: 35%;
	box-sizing: border-box;
	text-align: left;
	padding: 24px;
	border-right: solid 1px var(--divider);
}

.info {
	display: flex;
	box-sizing: border-box;
	align-items: center;
	padding: 14px;
	border-radius: 8px;
	--c: rgb(255 196 0 / 15%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
	background-size: 16px 16px;
}

.avatar {
	width: 42px;
	height: 42px;
}

.names {
	margin-left: 0.3em;
	padding: 0 8px;
	flex: 1;
}

.name {
	font-weight: bold;
}

.detail {
	flex: 1;
	padding: 24px;
}

</style>
