<template>
<div class="bcekxzvu _gap _panel">
	<div class="target">
		<MkA v-user-preview="report.targetUserId" class="info" :to="`/user-info/${report.targetUserId}`">
			<MkAvatar class="avatar" :user="report.targetUser" :show-indicator="true" :disable-link="true"/>
			<div class="names">
				<MkUserName class="name" :user="report.targetUser"/>
				<MkAcct class="acct" :user="report.targetUser" style="display: block;"/>
			</div>
		</MkA>
		<MkKeyValue class="_formBlock">
			<template #key>{{ i18n.ts.registeredDate }}</template>
			<template #value>{{ new Date(report.targetUser.createdAt).toLocaleString() }} (<MkTime :time="report.targetUser.createdAt"/>)</template>
		</MkKeyValue>
	</div>
	<div class="detail">
		<div>
			<Mfm :text="report.comment"/>
		</div>
		<hr/>
		<div>{{ i18n.ts.reporter }}: <MkAcct :user="report.reporter"/></div>
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
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/form/switch.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import { acct, userPage } from '@/filters/user';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	report: any;
}>();

const emit = defineEmits<{
	(ev: 'resolved', reportId: string): void;
}>();

let forward = $ref(props.report.forwarded);

function resolve() {
	os.apiWithDialog('admin/resolve-abuse-user-report', {
		forward: forward,
		reportId: props.report.id,
	}).then(() => {
		emit('resolved', props.report.id);
	});
}
</script>

<style lang="scss" scoped>
.bcekxzvu {
	display: flex;

	> .target {
		width: 35%;
		box-sizing: border-box;
		text-align: left;
		padding: 24px;
		border-right: solid 1px var(--divider);

		> .info {
			display: flex;
			box-sizing: border-box;
			align-items: center;
			padding: 14px;
			border-radius: 8px;
			--c: rgb(255 196 0 / 15%);
			background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
			background-size: 16px 16px;

			> .avatar {
				width: 42px;
				height: 42px;
			}

			> .names {
				margin-left: 0.3em;
				padding: 0 8px;
				flex: 1;

				> .name {
					font-weight: bold;
				}
			}
		}
	}

	> .detail {
		flex: 1;
		padding: 24px;
	}
}
</style>
