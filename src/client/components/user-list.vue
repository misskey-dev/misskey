<template>
<x-container :body-togglable="true" :expanded="expanded">
	<template #header><slot></slot></template>

	<mk-error v-if="error" @retry="init()"/>

	<div class="efvhhmdq">
		<div class="no-users" v-if="empty">
			<p>{{ $t('no-users') }}</p>
		</div>
		<div class="user" v-for="user in users" :key="user.id">
			<mk-avatar class="avatar" :user="user"/>
			<div class="body">
				<div class="name">
					<router-link class="name" :to="user | userPage" v-user-preview="user.id"><mk-user-name :user="user"/></router-link>
					<p class="username">@{{ user | acct }}</p>
				</div>
				<div class="description" v-if="user.description" :title="user.description">
					<mfm :text="user.description" :is-note="false" :author="user" :i="$store.state.i" :custom-emojis="user.emojis" :plain="true" :nowrap="true"/>
				</div>
				<mk-follow-button class="koudoku-button" v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" :user="user" mini/>
			</div>
		</div>
		<button class="more" :class="{ fetching: moreFetching }" v-if="more" @click="fetchMore()" :disabled="moreFetching">
			<template v-if="moreFetching"><fa icon="spinner" pulse fixed-width/></template>{{ moreFetching ? $t('@.loading') : $t('@.load-more') }}
		</button>
	</div>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import paging from '../scripts/paging';
import XContainer from './ui/container.vue';

export default Vue.extend({
	i18n,

	components: {
		XContainer
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
	}
});
</script>

<style lang="scss" scoped>
.efvhhmdq {
	> .no-users {
		text-align: center;
	}

	> .user {
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
			display: flex;
			width: calc(100% - 54px);

			> .name {
				width: 45%;

				> .name {
					margin: 0;
					font-size: 16px;
					line-height: 24px;
				}

				> .username {
					display: block;
					margin: 0;
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
			}

			> .koudoku-button {
				position: absolute;
				top: 8px;
				right: 0;
			}
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
