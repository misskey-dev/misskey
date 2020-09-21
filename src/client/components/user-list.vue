<template>
<MkContainer :body-togglable="true" :expanded="expanded">
	<template #header><slot></slot></template>

	<MkError v-if="error" @retry="init()"/>

	<div class="efvhhmdq">
		<div class="no-users" v-if="empty">
			<p>{{ $t('noUsers') }}</p>
		</div>
		<div class="user" v-for="user in users" :key="user.id">
			<MkAvatar class="avatar" :user="user"/>
			<div class="body">
				<div class="name">
					<router-link class="name" :to="userPage(user)" v-user-preview="user.id"><MkUserName :user="user"/></router-link>
					<span class="username"><MkAcct :user="user"/></span>
				</div>
				<div class="description">
					<mfm v-if="user.description" :text="user.description" :is-note="false" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
					<span v-else class="empty">{{ $t('noAccountDescription') }}</span>
				</div>
			</div>
			<MkFollowButton class="koudoku-button" v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" :user="user" mini/>
		</div>
		<button class="more" ref="loadMore" :class="{ fetching: moreFetching }" v-show="more" :disabled="moreFetching">
			<template v-if="moreFetching"><Fa icon="spinner" pulse fixed-width/></template>{{ moreFetching ? $t('loading') : $t('loadMore') }}
		</button>
	</div>
</MkContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import paging from '@/scripts/paging';
import MkContainer from './ui/container.vue';
import MkFollowButton from './follow-button.vue';
import { userPage } from '../filters/user';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkContainer,
		MkFollowButton,
	},

	mixins: [
		paging({}),
	],

	props: {
		pagination: {
			required: true
		},
		extract: {
			required: false
		},
		expanded: {
			type: Boolean,
			default: true
		},
	},

	computed: {
		users() {
			return this.extract ? this.extract(this.items) : this.items;
		}
	},

	methods: {
		userPage
	}
});
</script>

<style lang="scss" scoped>
.efvhhmdq {
	> .no-users {
		text-align: center;
	}

	> .user {
		position: relative;
		display: flex;
		padding: 16px;
		border-bottom: solid 1px var(--divider);

		&:last-child {
			border-bottom: none;
		}

		> .avatar {
			display: block;
			flex-shrink: 0;
			margin: 0 12px 0 0;
			width: 42px;
			height: 42px;
			border-radius: 8px;
		}

		> .body {
			flex: 1;

			> .name {
				font-weight: bold;

				> .name {
					margin-right: 8px;
				}

				> .username {
					opacity: 0.7;
				}
			}

			> .description {
				font-size: 90%;

				> .empty {
					opacity: 0.7;
				}
			}
		}

		> .koudoku-button {
			flex-shrink: 0;
		}
	}

	> .more {
		display: block;
		width: 100%;
		padding: 16px;

		&:hover {
			background: rgba(#000, 0.025);
		}

		&:active {
			background: rgba(#000, 0.05);
		}

		&.fetching {
			cursor: wait;
		}

		> [data-icon] {
			margin-right: 4px;
		}
	}
}
</style>
