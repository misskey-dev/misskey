<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="600" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init">
			<div v-if="tab === 'overview'" class="_gaps_m">
				<div class="aeakzknw">
					<MkAvatar class="avatar" :user="user" indicator link preview/>
					<div class="body">
						<span class="name"><MkUserName class="name" :user="user"/></span>
						<span class="sub"><span class="acct _monospace">@{{ acct(user) }}</span></span>
						<span class="state">
							<span v-if="admin" class="admin">Admin</span>
							<span v-if="moderator" class="moderator">Moderator</span>
							<span v-if="silenced" class="silenced">Silenced</span>
							<span v-if="limited" class="limited">Limited</span>
							<span v-if="suspended" class="suspended">Suspended</span>
							<span v-if="deleted" class="deleted">Deleted</span>
						</span>
					</div>
				</div>

				<MkInfo v-if="user.username.includes('.')">{{ i18n.ts.isSystemAccount }}</MkInfo>

				<FormLink v-if="user.host" :to="`/instance-info/${user.host}`">{{ i18n.ts.instanceInfo }}</FormLink>

				<div style="display: flex; flex-direction: column; gap: 1em;">
					<MkKeyValue :copy="user.id" oneline>
						<template #key>ID</template>
						<template #value><span class="_monospace">{{ user.id }}</span></template>
					</MkKeyValue>
					<MkKeyValue oneline>
						<template #key>{{ i18n.ts.createdAt }}</template>
						<template #value><span class="_monospace"><MkTime :time="user.createdAt" :mode="'detail'"/></span></template>
					</MkKeyValue>
					<MkKeyValue v-if="info" oneline>
						<template #key>{{ i18n.ts.lastActiveDate }}</template>
						<template #value><span class="_monospace"><MkTime :time="info.lastActiveDate" :mode="'detail'"/></span></template>
					</MkKeyValue>
					<MkKeyValue v-if="info" oneline>
						<template #key>{{ i18n.ts.email }}</template>
						<template #value><span class="_monospace">{{ info.email }}</span></template>
					</MkKeyValue>
					<MkKeyValue v-if="iAmAdmin && ips && ips.length > 0" :copy="ips[0].ip" oneline>
						<template #key>IP (recent)</template>
						<template #value><span class="_monospace">{{ ips[0].ip }}</span></template>
					</MkKeyValue>
				</div>

				<MkTextarea v-model="moderationNote" manualSave>
					<template #label>{{ i18n.ts.moderationNote }}</template>
				</MkTextarea>

				<FormSection>
					<div class="_gaps">
						<MkFolder v-if="iAmModerator" defaultOpen>
							<template #icon><i class="ti ti-shield"></i></template>
							<template #label>{{ i18n.ts.moderation }}</template>
							<div class="_gaps">
								<MkSwitch v-model="suspended" @update:modelValue="toggleSuspend">{{ i18n.ts.suspend }}</MkSwitch>
								<div v-if="user.host == null" class="_buttons">
									<MkButton @click="resetPassword"><i class="ti ti-key"></i> {{ i18n.ts.resetPassword }}</MkButton>
									<MkButton danger @click="regenerateLoginToken"><i class="ti ti-refresh"></i> {{ i18n.ts.regenerateLoginToken }}</MkButton>
								</div>
								<MkButton inline danger @click="updateUserName"><i class="ti ti-user-edit"></i> {{ i18n.ts.changeUserName }}</MkButton>
								<MkButton inline danger @click="unsetUserAvatar"><i class="ti ti-user-circle"></i> {{ i18n.ts.unsetUserAvatar }}</MkButton>
								<MkButton inline danger @click="unsetUserBanner"><i class="ti ti-photo"></i> {{ i18n.ts.unsetUserBanner }}</MkButton>
								<MkFolder v-if="user?.mutualLinkSections && user?.mutualLinkSections.reduce((acc, section) => acc + section.mutualLinks.length, 0) > 0">
									<template #icon><i class="ti ti-link"></i></template>
									<template #label>{{ i18n.ts._profile.mutualLinksEdit }}</template>

									<div v-for="mutualLinkSection in user?.mutualLinkSections">
										<div v-for="mutualLink in mutualLinkSection.mutualLinks" :key="mutualLink.id" :class="$style.fields">
											<p> {{ mutualLink.url }} </p>
											<img :class="$style.mutualLinkImg" :src="mutualLink.imgSrc" :alt="mutualLink.description"/>
											<p> {{ mutualLink.description }} </p>
											<MkButton inline danger @click="unsetUserMutualLink(mutualLink.id)"><i class="ti ti-link"></i> {{ i18n.ts.unsetUserMutualLink }}</MkButton>
										</div>
									</div>
								</MkFolder>
							</div>
						</MkFolder>

						<MkFolder>
							<template #icon><i class="ti ti-license"></i></template>
							<template #label>{{ i18n.ts._role.policies }}</template>
							<div class="_gaps">
								<div v-for="policy in Object.keys(info.policies)" :key="policy">
									{{ policy }} ... {{ info.policies[policy] }}
								</div>
							</div>
						</MkFolder>

						<MkFolder>
							<template #icon><i class="ti ti-password"></i></template>
							<template #label>IP</template>
							<MkInfo v-if="!iAmAdmin" warn>{{ i18n.ts.requireAdminForView }}</MkInfo>
							<MkInfo v-else>The date is the IP address was first acknowledged.</MkInfo>
							<template v-if="iAmAdmin && ips">
								<div v-for="record in ips" :key="record.ip" class="_monospace" :class="$style.ip" style="margin: 1em 0;">
									<span class="date">{{ record.createdAt }}</span>
									<span class="ip">{{ record.ip }}</span>
								</div>
							</template>
						</MkFolder>

						<MkFolder v-if="$i.isAdmin">
							<template #icon><i class="ti ti-user-x"></i></template>
							<template #label>{{ i18n.ts.deleteAccount }}</template>
							<div class="_gaps">
								<MkButton inline danger @click="deleteAccount(true)"><i class="ti ti-user-x"></i> {{ i18n.ts.deleteAccount }}</MkButton>
								<MkButton inline danger @click="deleteAccount(false)"><i class="ti ti-file-shredder"></i> {{ i18n.ts.deleteAccount }} ({{ i18n.ts.all }})</MkButton>
							</div>
						</MkFolder>
					</div>
				</FormSection>
			</div>

			<div v-else-if="tab === 'roles'" class="_gaps">
				<MkButton primary rounded @click="assignRole"><i class="ti ti-plus"></i> {{ i18n.ts.assign }}</MkButton>

				<div v-for="role in info.roles" :key="role.id">
					<div :class="$style.roleItemMain">
						<MkRolePreview :class="$style.role" :role="role" :forModeration="true"/>
						<button class="_button" @click="toggleRoleItem(role)"><i class="ti ti-chevron-down"></i></button>
						<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnassign" @click="unassignRole(role, $event)"><i class="ti ti-x"></i></button>
						<button v-else class="_button" :class="$style.roleUnassign" disabled><i class="ti ti-ban"></i></button>
					</div>
					<div v-if="expandedRoles.includes(role.id)" :class="$style.roleItemSub">
						<div>Assigned: <MkTime :time="info.roleAssigns.find(a => a.roleId === role.id).createdAt" mode="detail"/></div>
						<div v-if="info.roleAssigns.find(a => a.roleId === role.id).expiresAt">Period: {{ new Date(info.roleAssigns.find(a => a.roleId === role.id).expiresAt).toLocaleString() }}</div>
						<div v-else>Period: {{ i18n.ts.indefinitely }}</div>
					</div>
				</div>
			</div>

			<div v-else-if="tab === 'announcements'" class="_gaps">
				<MkButton primary rounded @click="createAnnouncement"><i class="ti ti-plus"></i> {{ i18n.ts.new }}</MkButton>

				<MkPagination ref="announcementsPaginationEl" :pagination="announcementsPagination">
					<template #default="{ items }">
						<div class="_gaps_s">
							<div v-for="announcement in items" :key="announcement.id" v-panel :class="$style.announcementItem" @click="editAnnouncement(announcement)">
								<span style="margin-right: 0.5em;">
									<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
									<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" style="color: var(--warn);"></i>
									<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" style="color: var(--error);"></i>
									<i v-else-if="announcement.icon === 'success'" class="ti ti-check" style="color: var(--success);"></i>
								</span>
								<span>{{ announcement.title }}</span>
								<span v-if="announcement.reads > 0" style="margin-left: auto; opacity: 0.7;">{{ i18n.ts.messageRead }} <span v-if="announcement.lastReadAt">(<MkTime :time="announcement.lastReadAt" mode="absolute"/>)</span></span>
							</div>
						</div>
					</template>
				</MkPagination>
			</div>

			<div v-else-if="tab === 'drive'" class="_gaps">
				<MkButton v-if="iAmModerator" inline danger @click="deleteAllFiles"><i class="ti ti-trash"></i> {{ i18n.ts.deleteAllFiles }}</MkButton>
				<MkFileListForAdmin :pagination="filesPagination" viewMode="grid"/>
			</div>

			<div v-else-if="tab === 'chart'" class="_gaps_m">
				<div class="cmhjzshm">
					<div class="selects">
						<MkSelect v-model="chartSrc" style="margin: 0 10px 0 0; flex: 1;">
							<option value="per-user-notes">{{ i18n.ts.notes }}</option>
						</MkSelect>
					</div>
					<div class="charts">
						<div class="label">{{ i18n.tsx.recentNHours({ n: 90 }) }}</div>
						<MkChart class="chart" :src="chartSrc" span="hour" :limit="90" :args="{ user, withoutAll: true }" :detailed="true"></MkChart>
						<div class="label">{{ i18n.tsx.recentNDays({ n: 90 }) }}</div>
						<MkChart class="chart" :src="chartSrc" span="day" :limit="90" :args="{ user, withoutAll: true }" :detailed="true"></MkChart>
					</div>
				</div>
			</div>

			<div v-else-if="tab === 'activitypub'" class="_gaps_m">
				<div style="display: flex; flex-direction: column; gap: 1em;">
					<MkKeyValue v-if="user.host" oneline>
						<template #key>{{ i18n.ts.instanceInfo }}</template>
						<template #value><MkA :to="`/instance-info/${user.host}`" class="_link">{{ user.host }} <i class="ti ti-chevron-right"></i></MkA></template>
					</MkKeyValue>
					<MkKeyValue v-else oneline>
						<template #key>{{ i18n.ts.instanceInfo }}</template>
						<template #value>(Local user)</template>
					</MkKeyValue>
					<MkKeyValue oneline>
						<template #key>{{ i18n.ts.updatedAt }}</template>
						<template #value><MkTime v-if="user.lastFetchedAt" mode="detail" :time="user.lastFetchedAt"/><span v-else>N/A</span></template>
					</MkKeyValue>
					<MkKeyValue v-if="ap" oneline>
						<template #key>Type</template>
						<template #value><span class="_monospace">{{ ap.type }}</span></template>
					</MkKeyValue>
				</div>

				<MkButton v-if="user.host != null" @click="updateRemoteUser"><i class="ti ti-refresh"></i> {{ i18n.ts.updateRemoteUser }}</MkButton>

				<MkFolder>
					<template #label>Raw</template>

					<MkObjectView v-if="ap" tall :value="ap">
					</MkObjectView>
				</MkFolder>
			</div>

			<div v-else-if="tab === 'raw'" class="_gaps_m">
				<MkObjectView v-if="info && $i.isAdmin" tall :value="info">
				</MkObjectView>

				<MkObjectView tall :value="user">
				</MkObjectView>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkChart from '@/components/MkChart.vue';
import MkObjectView from '@/components/MkObjectView.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkFileListForAdmin from '@/components/MkFileListForAdmin.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { url } from '@/config.js';
import { acct } from '@/filters/user.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import { iAmAdmin, iAmModerator, $i } from '@/account.js';
import MkRolePreview from '@/components/MkRolePreview.vue';
import MkPagination from '@/components/MkPagination.vue';

const props = withDefaults(defineProps<{
	userId: string;
	initialTab?: string;
}>(), {
	initialTab: 'overview',
});

const tab = ref(props.initialTab);
const chartSrc = ref('per-user-notes');
const user = ref<null | Misskey.entities.UserDetailed>();
const init = ref<ReturnType<typeof createFetcher>>();
const info = ref<any>();
const ips = ref<Misskey.entities.AdminGetUserIpsResponse | null>(null);
const ap = ref<any>(null);
const admin = ref(false);
const moderator = ref(false);
const silenced = ref(false);
const limited = ref(false);
const suspended = ref(false);
const deleted = ref(false);
const moderationNote = ref('');
const filesPagination = {
	endpoint: 'admin/drive/files' as const,
	limit: 10,
	params: computed(() => ({
		userId: props.userId,
	})),
};
const announcementsPaginationEl = ref<InstanceType<typeof MkPagination>>();
const announcementsPagination = {
	endpoint: 'admin/announcements/list' as const,
	offsetMode: true,
	limit: 10,
	params: computed(() => ({
		userId: props.userId,
	})),
};
const expandedRoles = ref([]);

function createFetcher() {
	return () => Promise.all([misskeyApi('users/show', {
		userId: props.userId,
	}), misskeyApi('admin/show-user', {
		userId: props.userId,
	}), iAmAdmin ? misskeyApi('admin/get-user-ips', {
		userId: props.userId,
	}) : Promise.resolve(null)]).then(([_user, _info, _ips]) => {
		user.value = _user;
		info.value = _info;
		ips.value = _ips;
		admin.value = info.value.isAdmin;
		moderator.value = info.value.isModerator;
		silenced.value = info.value.isSilenced;
		limited.value = info.value.isLimited;
		suspended.value = info.value.isSuspended;
		deleted.value = info.value.isDeleted;
		moderationNote.value = info.value.moderationNote;

		watch(moderationNote, async () => {
			await misskeyApi('admin/update-user-note', {
				userId: user.value.id, text: moderationNote.value,
			}).then(refreshUser);
		});
	});
}

function refreshUser() {
	init.value = createFetcher();
}

async function updateRemoteUser() {
	await os.apiWithDialog('federation/update-remote-user', {
		userId: user.value.id,
	}).then(refreshUser);
}

async function resetPassword() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.resetPasswordConfirm,
	});
	if (confirm.canceled) {
		return;
	} else {
		const { password } = await misskeyApi('admin/reset-password', {
			userId: user.value.id,
		});
		os.alert({
			type: 'success',
			text: i18n.tsx.newPasswordIs({ password }),
		});
	}
}

async function regenerateLoginToken() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.regenerateLoginTokenConfirm,
	});
	if (confirm.canceled) return;

	await os.apiWithDialog('admin/regenerate-user-token', {
		userId: user.value.id,
	}).then(refreshUser);
}

async function toggleSuspend(v) {
	const confirm = await os.confirm({
		type: 'warning',
		text: v ? i18n.ts.suspendConfirm : i18n.ts.unsuspendConfirm,
	});
	if (confirm.canceled) {
		suspended.value = !v;
	} else {
		await misskeyApi(v ? 'admin/suspend-user' : 'admin/unsuspend-user', {
			userId: user.value.id,
		}).then(refreshUser);
	}
}

async function updateUserName() {
	const { canceled, result: name } = await os.inputText({
		type: 'text',
		title: i18n.ts.enterUsername,
		default: '',
	});
	if (canceled) return;

	await os.apiWithDialog('admin/update-user-name', {
		userId: user.value.id,
		name: name || undefined,
	}).then(refreshUser);
}

async function unsetUserAvatar() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unsetUserAvatarConfirm,
	});
	if (confirm.canceled) return;

	await os.apiWithDialog('admin/unset-user-avatar', {
		userId: user.value.id,
	}).then(refreshUser);
}

async function unsetUserBanner() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unsetUserBannerConfirm,
	});
	if (confirm.canceled) return;

	await os.apiWithDialog('admin/unset-user-banner', {
		userId: user.value.id,
	}).then(refreshUser);
}

async function unsetUserMutualLink(mutualLinkid: string) {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unsetUserMutualLinkConfirm,
	});
	if (confirm.canceled) return;

	await os.apiWithDialog('admin/unset-user-mutual-link', {
		userId: user.value.id,
		itemId: mutualLinkid,
	}).then(refreshUser);
}

async function deleteAllFiles() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteAllFilesConfirm,
	});
	if (confirm.canceled) return;

	const typed = await os.inputText({
		text: i18n.tsx.typeToConfirm({ x: user.value?.username }),
	});
	if (typed.canceled) return;

	if (typed.result === user.value?.username) {
		await os.apiWithDialog('admin/drive/delete-all-files-of-a-user', {
			userId: user.value.id,
		}).then(refreshUser);
	} else {
		os.alert({
			type: 'error',
			text: 'input not match',
		});
	}
}

async function deleteAccount(soft: boolean) {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteAccountConfirm,
	});
	if (confirm.canceled) return;

	const typed = await os.inputText({
		text: i18n.tsx.typeToConfirm({ x: user.value?.username }),
	});
	if (typed.canceled) return;

	if (typed.result === user.value?.username) {
		await os.apiWithDialog('admin/accounts/delete', {
			userId: user.value.id,
			soft,
		}).then(refreshUser);
	} else {
		os.alert({
			type: 'error',
			text: 'input not match',
		});
	}
}

async function assignRole() {
	const roles = await misskeyApi('admin/roles/list');

	const { canceled, result: roleId } = await os.select({
		title: i18n.ts._role.chooseRoleToAssign,
		items: roles.map(r => ({ text: r.name, value: r.id })),
	});
	if (canceled) return;

	const { canceled: canceled2, result: period } = await os.select({
		title: i18n.ts.period + ': ' + roles.find(r => r.id === roleId)!.name,
		items: [{
			value: 'indefinitely', text: i18n.ts.indefinitely,
		}, {
			value: 'oneHour', text: i18n.ts.oneHour,
		}, {
			value: 'oneDay', text: i18n.ts.oneDay,
		}, {
			value: 'oneWeek', text: i18n.ts.oneWeek,
		}, {
			value: 'oneMonth', text: i18n.ts.oneMonth,
		}],
		default: 'indefinitely',
	});
	if (canceled2) return;

	const expiresAt = period === 'indefinitely' ? null
		: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
		: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
		: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
		: period === 'oneMonth' ? Date.now() + (1000 * 60 * 60 * 24 * 30)
		: null;

	await os.apiWithDialog('admin/roles/assign', {
		roleId, userId: user.value.id, expiresAt,
	}).then(refreshUser);
}

async function unassignRole(role, ev) {
	os.popupMenu([{
		text: i18n.ts.unassign,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			await os.apiWithDialog('admin/roles/unassign', {
				roleId: role.id, userId: user.value.id,
			}).then(refreshUser);
		},
	}], ev.currentTarget ?? ev.target);
}

function toggleRoleItem(role) {
	if (expandedRoles.value.includes(role.id)) {
		expandedRoles.value = expandedRoles.value.filter(x => x !== role.id);
	} else {
		expandedRoles.value.push(role.id);
	}
}

function createAnnouncement(): void {
	os.popup(defineAsyncComponent(() => import('@/components/MkUserAnnouncementEditDialog.vue')), {
		user: user.value,
	}, {
		done: async () => {
			announcementsPaginationEl.value?.reload();
		},
	}, 'closed');
}

function editAnnouncement(announcement): void {
	os.popup(defineAsyncComponent(() => import('@/components/MkUserAnnouncementEditDialog.vue')), {
		user: user.value,
		announcement,
	}, {
		done: async () => {
			announcementsPaginationEl.value?.reload();
		},
	}, 'closed');
}

watch(() => props.userId, () => {
	init.value = createFetcher();
}, {
	immediate: true,
});

watch(user, () => {
	misskeyApi('ap/get', {
		uri: user.value.uri ?? `${url}/users/${user.value.id}`,
	}).then(res => {
		ap.value = res;
	});
});

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'roles',
	title: i18n.ts.roles,
	icon: 'ti ti-badges',
}, {
	key: 'announcements',
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
}, {
	key: 'drive',
	title: i18n.ts.drive,
	icon: 'ti ti-cloud',
}, {
	key: 'chart',
	title: i18n.ts.charts,
	icon: 'ti ti-chart-line',
}, {
	key: 'activitypub',
	title: 'ActivityPub',
	icon: 'ti ti-share',
}, {
	key: 'raw',
	title: 'Raw',
	icon: 'ti ti-code',
}]);

definePageMetadata(() => ({
	title: user.value ? acct(user.value) : i18n.ts.userInfo,
	icon: 'ti ti-user-exclamation',
}));
</script>

<style lang="scss" scoped>
.aeakzknw {
	display: flex;
	align-items: center;

	> .avatar {
		display: block;
		width: 64px;
		height: 64px;
		margin-right: 16px;
	}

	> .body {
		flex: 1;
		overflow: hidden;

		> .name {
			display: block;
			width: 100%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> .sub {
			display: block;
			width: 100%;
			font-size: 85%;
			opacity: 0.7;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> .state {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
			margin-top: 4px;

			&:empty {
				display: none;
			}

			> .admin,
			> .moderator,
			> .silenced,
			> .limited,
			> .suspended,
			> .deleted {
				display: inline-block;
				border: solid 1px;
				border-radius: 6px;
				padding: 2px 6px;
				font-size: 85%;
			}

			> .admin {
				color: var(--success);
				border-color: var(--success);
			}

			> .moderator {
				color: var(--success);
				border-color: var(--success);
			}

			> .silenced {
				color: var(--warn);
				border-color: var(--warn);
			}

			> .limited {
				color: var(--error);
				border-color: var(--error);
			}

			> .suspended {
				color: var(--error);
				border-color: var(--error);
			}

			> .deleted {
				color: var(--error);
				border-color: var(--error);
			}
		}
	}
}

.cmhjzshm {
	> .selects {
		display: flex;
		margin: 0 0 16px 0;
	}

	> .charts {
		> .label {
			margin-bottom: 12px;
			font-weight: bold;
		}
	}
}
</style>

<style lang="scss" module>
.ip {
	display: flex;

	> :global(.date) {
		opacity: 0.7;
	}

	> :global(.ip) {
		margin-left: auto;
	}
}

.roleItemMain {
	display: flex;
}

.role {
	flex: 1;
	min-width: 0;
	margin-right: 8px;
}

.roleItemSub {
	padding: 6px 12px;
	font-size: 85%;
	color: var(--fgTransparentWeak);
}

.roleUnassign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
}

.announcementItem {
	display: flex;
	padding: 8px 12px;
	border-radius: 6px;
	cursor: pointer;
}

.mutualLinkImg {
	max-width: 200px;
	max-height: 40px;
}
.fields {
	padding: 24px;
	border-bottom: solid 0.5px var(--divider);
	&:last-child {
		border-bottom: none;
	}
}
</style>
