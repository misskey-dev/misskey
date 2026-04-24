<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div :key="tab" class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkPagination :paginator="paginator">
			<template #empty><MkResult type="empty" :text="i18n.ts.noFollowRequests"/></template>
			<template #default="{items}">
				<div class="mk-follow-requests _gaps">
					<div v-for="req in items" :key="req.id" class="user _panel">
						<MkAvatar class="avatar" :user="displayUser(req)" indicator link preview/>
						<div class="body">
							<div class="name">
								<MkA v-user-preview="displayUser(req).id" class="name" :to="userPage(displayUser(req))"><MkUserName :user="displayUser(req)"/></MkA>
								<p class="acct">@{{ acct(displayUser(req)) }}</p>
							</div>
							<div v-if="tab === 'list'" class="commands">
								<MkButton class="command" rounded primary @click="accept(displayUser(req))"><i class="ti ti-check"></i> {{ i18n.ts.accept }}</MkButton>
								<MkButton class="command" rounded danger @click="reject(displayUser(req))"><i class="ti ti-x"></i> {{ i18n.ts.reject }}</MkButton>
							</div>
							<div v-else class="commands">
								<MkButton class="command" rounded danger @click="cancel(displayUser(req))"><i class="ti ti-x"></i> {{ i18n.ts.cancel }}</MkButton>
							</div>
						</div>
					</div>
				</div>
			</template>
		</MkPagination>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref, watch } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import { userPage, acct } from '@/filters/user.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';
import { Paginator } from '@/utility/paginator.js';

const tab = ref($i?.isLocked ? 'list' : 'sent');

let paginator: Paginator<'following/requests/list' | 'following/requests/sent'>;

watch(tab, (newTab) => {
	if (newTab === 'list') {
		paginator = markRaw(new Paginator('following/requests/list', { limit: 10 }));
	} else {
		paginator = markRaw(new Paginator('following/requests/sent', { limit: 10 }));
	}
}, { immediate: true });

function accept(user: Misskey.entities.UserLite) {
	os.apiWithDialog('following/requests/accept', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

async function reject(user: Misskey.entities.UserLite) {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.tsx.rejectFollowRequestConfirm({ name: user.name || user.username }),
	});

	if (canceled) return;

	await os.apiWithDialog('following/requests/reject', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

async function cancel(user: Misskey.entities.UserLite) {
	const { canceled } = await os.confirm({
		type: 'question',
		text: i18n.tsx.cancelFollowRequestConfirm({ name: user.name || user.username }),
	});

	if (canceled) return;

	await os.apiWithDialog('following/requests/cancel', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

function displayUser(req: Misskey.entities.FollowingRequestsListResponse[number]) {
	return tab.value === 'list' ? req.follower : req.followee;
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [
	{
		key: 'list',
		title: i18n.ts._followRequest.recieved,
		icon: 'ti ti-download',
	}, {
		key: 'sent',
		title: i18n.ts._followRequest.sent,
		icon: 'ti ti-upload',
	},
]);

definePage(() => ({
	title: i18n.ts.followRequests,
	icon: 'ti ti-user-plus',
}));
</script>

<style lang="scss" scoped>
.mk-follow-requests {
	> .user {
		display: flex;
		padding: 16px;

		> .avatar {
			display: block;
			flex-shrink: 0;
			margin: 0 12px 0 0;
			width: 42px;
			height: 42px;
			border-radius: 8px;
		}

		> .body {
			display: flex;
			width: calc(100% - 54px);
			position: relative;
			flex-wrap: wrap;
			gap: 8px;

			> .name {
				flex: 1 1 50%;

				> .name,
				> .acct {
					display: block;
					white-space: nowrap;
					text-overflow: ellipsis;
					overflow: hidden;
					margin: 0;
				}

				> .name {
					line-height: 24px;
				}

				> .acct {
					line-height: 16px;
					opacity: 0.7;
				}
			}

			> .description {
				width: 55%;
				line-height: 42px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				opacity: 0.7;
				padding-right: 40px;
				padding-left: 8px;
				box-sizing: border-box;

				@media (max-width: 500px) {
					display: none;
				}
			}

			> .commands {
				display: flex;
				gap: 8px;
			}

			> .actions {
				position: absolute;
				top: 0;
				bottom: 0;
				right: 0;
				margin: auto 0;

				> button {
					padding: 12px;
				}
			}
		}
	}
}
</style>
