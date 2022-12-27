<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :content-max="800">
		<MkPagination ref="paginationComponent" :pagination="pagination">
			<template #empty>
				<div class="_fullinfo">
					<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
					<div>{{ i18n.ts.noFollowRequests }}</div>
				</div>
			</template>
			<template #default="{items}">
				<div class="mk-follow-requests">
					<div v-for="req in items" :key="req.id" class="user _panel">
						<MkAvatar class="avatar" :user="req.follower" :show-indicator="true"/>
						<div class="body">
							<div class="name">
								<MkA v-user-preview="req.follower.id" class="name" :to="userPage(req.follower)"><MkUserName :user="req.follower"/></MkA>
								<p class="acct">@{{ acct(req.follower) }}</p>
							</div>
							<div v-if="req.follower.description" class="description" :title="req.follower.description">
								<Mfm :text="req.follower.description" :is-note="false" :author="req.follower" :i="$i" :custom-emojis="req.follower.emojis" :plain="true" :nowrap="true"/>
							</div>
							<div class="actions">
								<button class="_button" @click="accept(req.follower)"><i class="ti ti-check"></i></button>
								<button class="_button" @click="reject(req.follower)"><i class="ti ti-x"></i></button>
							</div>
						</div>
					</div>
				</div>
			</template>
		</MkPagination>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import { userPage, acct } from '@/filters/user';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const paginationComponent = ref<InstanceType<typeof MkPagination>>();

const pagination = {
	endpoint: 'following/requests/list' as const,
	limit: 10,
};

function accept(user) {
	os.api('following/requests/accept', { userId: user.id }).then(() => {
		paginationComponent.value.reload();
	});
}

function reject(user) {
	os.api('following/requests/reject', { userId: user.id }).then(() => {
		paginationComponent.value.reload();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.followRequests,
	icon: 'ti ti-user-plus',
})));
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

			> .name {
				width: 45%;

				@media (max-width: 500px) {
					width: 100%;
				}

				> .name,
				> .acct {
					display: block;
					white-space: nowrap;
					text-overflow: ellipsis;
					overflow: hidden;
					margin: 0;
				}

				> .name {
					font-size: 16px;
					line-height: 24px;
				}

				> .acct {
					font-size: 15px;
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
				font-size: 14px;
				padding-right: 40px;
				padding-left: 8px;
				box-sizing: border-box;

				@media (max-width: 500px) {
					display: none;
				}
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
