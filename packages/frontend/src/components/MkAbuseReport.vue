<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkFolder>
	<template #icon>
		<i v-if="report.resolved" class="ti ti-check" style="color: var(--success)"></i>
		<i v-else class="ti ti-exclamation-circle" style="color: var(--warn)"></i>
	</template>
	<template #label><MkAcct :user="report.targetUser"/> (by <MkAcct :user="report.reporter"/>)</template>
	<template #caption>{{ report.comment }}</template>
	<template #suffix><MkTime :time="report.createdAt"/></template>
	<template v-if="!report.resolved" #footer>
		<div class="_buttons">
			<MkButton primary @click="resolve">{{ i18n.ts.abuseMarkAsResolved }}</MkButton>
			<template v-if="report.targetUser.host == null || report.resolved">
				<MkButton primary @click="resolveAndForward">{{ i18n.ts.forwardReport }}</MkButton>
				<div v-tooltip:dialog="i18n.ts.forwardReportIsAnonymous" class="_button _help"><i class="ti ti-help-circle"></i></div>
			</template>
		</div>
	</template>

	<div :class="$style.root" class="_gaps_s">
		<MkFolder :withSpacer="false">
			<template #icon><MkAvatar :user="report.targetUser" style="width: 18px; height: 18px;"/></template>
			<template #label>Target: <MkAcct :user="report.targetUser"/></template>
			<template #suffix>#{{ report.targetUserId.toUpperCase() }}</template>

			<div style="container-type: inline-size;">
				<RouterView :router="targetRouter"/>
			</div>
		</MkFolder>

		<MkFolder :defaultOpen="true">
			<template #icon><i class="ti ti-message-2"></i></template>
			<template #label>{{ i18n.ts.details }}</template>
			<div>
				<Mfm :text="report.comment" :linkNavigationBehavior="'window'"/>
			</div>
		</MkFolder>

		<MkFolder :withSpacer="false">
			<template #icon><MkAvatar :user="report.reporter" style="width: 18px; height: 18px;"/></template>
			<template #label>{{ i18n.ts.reporter }}: <MkAcct :user="report.reporter"/></template>
			<template #suffix>#{{ report.reporterId.toUpperCase() }}</template>

			<div style="container-type: inline-size;">
				<RouterView :router="reporterRouter"/>
			</div>
		</MkFolder>

		<div v-if="report.assignee">
			{{ i18n.ts.moderator }}:
			<MkAcct :user="report.assignee"/>
		</div>
	</div>
</MkFolder>
</template>

<script lang="ts" setup>
import { provide, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { dateString } from '@/filters/date.js';
import MkFolder from '@/components/MkFolder.vue';
import RouterView from '@/components/global/RouterView.vue';
import { useRouterFactory } from '@/router/supplier';

const props = defineProps<{
	report: Misskey.entities.AdminAbuseUserReportsResponse[number];
}>();

const emit = defineEmits<{
	(ev: 'resolved', reportId: string): void;
}>();

const routerFactory = useRouterFactory();
const targetRouter = routerFactory(`/admin/user/${props.report.targetUserId}`);
targetRouter.init();
const reporterRouter = routerFactory(`/admin/user/${props.report.reporterId}`);
reporterRouter.init();

function resolve() {
	os.apiWithDialog('admin/resolve-abuse-user-report', {
		reportId: props.report.id,
	}).then(() => {
		emit('resolved', props.report.id);
	});
}

function resolveAndForward() {
	os.apiWithDialog('admin/resolve-abuse-user-report', {
		forward: true,
		reportId: props.report.id,
	}).then(() => {
		emit('resolved', props.report.id);
	});
}
</script>

<style lang="scss" module>
.root {
}
</style>
