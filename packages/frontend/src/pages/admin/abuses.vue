<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div v-if="tab === 'list'">
			<div class="reports">
				<div class="">
					<div class="inputs" style="display: flex;">
						<MkSelect v-model="state" :class="$style.state">
							<template #label>{{ i18n.ts.state }}</template>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="unresolved">{{ i18n.ts.unresolved }}</option>
							<option value="resolved">{{ i18n.ts.resolved }}</option>
						</MkSelect>
						<MkSelect v-model="targetUserOrigin" :class="$style.targetUserOrigin">
							<template #label>{{ i18n.ts.reporteeOrigin }}</template>
							<option value="combined">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.local }}</option>
							<option value="remote">{{ i18n.ts.remote }}</option>
						</MkSelect>
						<MkSelect v-model="reporterOrigin" :class="$style.reporterOrigin">
							<template #label>{{ i18n.ts.reporterOrigin }}</template>
							<option value="combined">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.local }}</option>
							<option value="remote">{{ i18n.ts.remote }}</option>
						</MkSelect>
					</div>
					<!-- TODO
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model="searchUsername" style="margin: 0; flex: 1;" type="text" :spellcheck="false">
					<span>{{ i18n.ts.username }}</span>
				</MkInput>
				<MkInput v-model="searchHost" style="margin: 0; flex: 1;" type="text" :spellcheck="false" :disabled="pagination.params().origin === 'local'">
					<span>{{ i18n.ts.host }}</span>
				</MkInput>
			</div>
			-->

					<MkPagination v-slot="{items}" ref="reports" :pagination="pagination" style="margin-top: var(--margin);">
						<XAbuseReport v-for="report in items" :key="report.id" :report="report" @resolved="resolved"/>
					</MkPagination>
				</div>
			</div>
		</div>
		<div v-else>
			<div class="_gaps">
				<MkFolder ref="folderComponent">
					<template #label><i class="ti ti-plus" style="margin-right: 5px;"></i>{{ i18n.ts.createNew }}</template>
					<MkAbuseReportResolver v-model="newResolver" :editable="true">
						<template #button>
							<MkButton primary :class="$style.margin" @click="create">{{ i18n.ts.create }}</MkButton>
						</template>
					</MkAbuseReportResolver>
				</MkFolder>
				<MkPagination v-slot="{items}" ref="resolverPagingComponent" :pagination="resolverPagination">
					<MkSpacer v-for="resolver in items" :key="resolver.id" :marginMin="14" :marginMax="22" :class="$style.resolverList">
						<MkAbuseReportResolver v-model="editingResolver" :data="(resolver as any)" :editable="editableResolver === resolver.id">
							<template #button>
								<div v-if="editableResolver !== resolver.id">
									<MkButton primary inline :class="$style.buttonMargin" @click="edit(resolver.id)"><i class="ti ti-pencil"></i> {{ i18n.ts.edit }}</MkButton>
									<MkButton danger inline @click="deleteResolver(resolver.id)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
								</div>
								<div v-else>
									<MkButton primary inline @click="save">{{ i18n.ts.save }}</MkButton>
								</div>
							</template>
						</MkAbuseReportResolver>
					</MkSpacer>
				</MkPagination>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, shallowRef, ref } from 'vue';

import XHeader from './_header_.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkAbuseReportResolver from '@/components/MkAbuseReportResolver.vue';
import XAbuseReport from '@/components/MkAbuseReport.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const reports = shallowRef<InstanceType<typeof MkPagination>>();
const resolverPagingComponent = ref<InstanceType<typeof MkPagination>>();
const folderComponent = ref<InstanceType<typeof MkFolder>>();

const state = ref('unresolved');
const reporterOrigin = ref('combined');
const targetUserOrigin = ref('combined');
const tab = ref('list');
const editableResolver = ref<null | string>(null);
const defaultResolver = {
	name: '',
	targetUserPattern: '',
	reporterPattern: '',
	reportContentPattern: '',
	expirationDate: '',
	expiresAt: 'indefinitely',
	forward: false,
};

const newResolver = ref<{
	name: string;
	targetUserPattern: string;
	reporterPattern: string;
	reportContentPattern: string;
	expirationDate: string;
	expiresAt: string;
	forward: boolean;
}>(defaultResolver);

const editingResolver = ref<{
	name: string;
	targetUserPattern: string;
	reporterPattern: string;
	reportContentPattern: string;
	expiresAt: string;
	expirationDate: string;
	forward: boolean;
	previousExpiresAt?: string;
}>(defaultResolver);

const pagination = {
	endpoint: 'admin/abuse-user-reports' as const,
	limit: 10,
	params: computed(() => ({
		state: state.value,
		reporterOrigin: reporterOrigin.value,
		targetUserOrigin: targetUserOrigin.value,
	})),
};

const resolverPagination = {
	endpoint: 'admin/abuse-report-resolver/list' as const,
	limit: 10,
};

function resolved(reportId) {
	reports.value!.removeItem(item => item.id === reportId);
}

function edit(id: string) {
	editableResolver.value = id;
}

function save(): void {
	os.apiWithDialog('admin/abuse-report-resolver/update', {
		resolverId: editableResolver.value,
		name: editingResolver.value.name,
		targetUserPattern: editingResolver.value.targetUserPattern || null,
		reporterPattern: editingResolver.value.reporterPattern || null,
		reportContentPattern: editingResolver.value.reportContentPattern || null,
		...(editingResolver.value.previousExpiresAt && editingResolver.value.previousExpiresAt === editingResolver.value.expiresAt ? {} : {
			expiresAt: editingResolver.value.expiresAt,
		}),
		forward: editingResolver.value.forward,
	}).then(() => {
		editableResolver.value = null;
	});
}

function deleteResolver(id: string): void {
	os.apiWithDialog('admin/abuse-report-resolver/delete', {
		resolverId: id,
	}).then(() => {
		resolverPagingComponent.value?.reload();
	});
}

function create(): void {
	os.apiWithDialog('admin/abuse-report-resolver/create', {
		name: newResolver.value.name,
		targetUserPattern: newResolver.value.targetUserPattern || null,
		reporterPattern: newResolver.value.reporterPattern || null,
		reportContentPattern: newResolver.value.reportContentPattern || null,
		expiresAt: newResolver.value.expiresAt,
		forward: newResolver.value.forward,
	}).then(() => {
		folderComponent.value?.toggle();
		resolverPagingComponent.value?.reload();
		newResolver.value.name = '';
		newResolver.value.targetUserPattern = '';
		newResolver.value.reporterPattern = '';
		newResolver.value.reportContentPattern = '';
		newResolver.value.expiresAt = 'indefinitely';
		newResolver.value.forward = false;
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'list',
	title: i18n.ts._abuse.list,
}, {
	key: 'resolver',
	title: i18n.ts._abuse.resolver,
}]);

definePageMetadata({
	title: i18n.ts.abuseReports,
	icon: 'ti ti-exclamation-circle',
});
</script>
<style lang="scss" module>
.input-base {
	margin: 0;
	flex: 1;
}

.buttonMargin {
	margin-right: 6px;
}

.state {
	@extend .input-base;
	@extend .buttonMargin;
}
.reporterOrigin {
	@extend .input-base;
}

.targetUserOrigin {
	@extend .input-base;
	@extend .buttonMargin;
}

.margin {
	margin: 0 auto var(--margin) auto;
}

.resolverList {
	background: var(--panel);
	border-radius: 6px;
	margin-bottom: 13px;
}
</style>
