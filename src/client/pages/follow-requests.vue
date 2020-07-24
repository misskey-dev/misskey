<template>
<div>
	<portal to="icon"><fa :icon="faUserClock"/></portal>
	<portal to="title" v-t="'followRequests'"></portal>

	<mk-pagination :pagination="pagination" class="mk-follow-requests" ref="list">
		<template #empty>
			<div class="_fullinfo">
				<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
				<div v-t="'noFollowRequests'"></div>
			</div>
		</template>
		<template #default="{items}">
			<div class="user _panel" v-for="req in items" :key="req.id">
				<mk-avatar class="avatar" :user="req.follower"/>
				<div class="body">
					<div class="name">
						<router-link class="name" :to="req.follower | userPage" v-user-preview="req.follower.id"><mk-user-name :user="req.follower"/></router-link>
						<p class="acct">@{{ req.follower | acct }}</p>
					</div>
					<div class="description" v-if="req.follower.description" :title="req.follower.description">
						<mfm :text="req.follower.description" :is-note="false" :author="req.follower" :i="$store.state.i" :custom-emojis="req.follower.emojis" :plain="true" :nowrap="true"/>
					</div>
					<div class="actions">
						<button class="_button" @click="accept(req.follower)"><fa :icon="faCheck"/></button>
						<button class="_button" @click="reject(req.follower)"><fa :icon="faTimes"/></button>
					</div>
				</div>
			</div>
		</template>
	</mk-pagination>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faUserClock, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '../components/ui/pagination.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('followRequests') as string
		};
	},

	components: {
		MkPagination
	},

	data() {
		return {
			pagination: {
				endpoint: 'following/requests/list',
				limit: 10,
			},
			faCheck, faTimes, faUserClock
		};
	},

	methods: {
		accept(user) {
			this.$root.api('following/requests/accept', { userId: user.id }).then(() => {
				this.$refs.list.reload();
			});
		},
		reject(user) {
			this.$root.api('following/requests/reject', { userId: user.id }).then(() => {
				this.$refs.list.reload();
			});
		}
	}
});
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
