<template>
<div class="mk-users-dialog">
	<div class="header">
		<span>{{ title }}</span>
		<button class="_button" @click="close()"><i class="fas fa-times"></i></button>
	</div>

	<div class="users">
		<MkA v-for="item in items" class="user" :key="item.id" :to="userPage(extract ? extract(item) : item)">
			<MkAvatar :user="extract ? extract(item) : item" class="avatar" :disable-link="true" :show-indicator="true"/>
			<div class="body">
				<MkUserName :user="extract ? extract(item) : item" class="name"/>
				<MkAcct :user="extract ? extract(item) : item" class="acct"/>
			</div>
		</MkA>
	</div>
	<button class="more _button" v-appear="$store.state.enableInfiniteScroll ? fetchMore : null" @click="fetchMore" v-show="more" :disabled="moreFetching">
		<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
		<template v-if="moreFetching"><i class="fas fa-spinner fa-pulse fa-fw"></i></template>
	</button>

	<p class="empty" v-if="empty">{{ $ts.noUsers }}</p>

	<MkError v-if="error" @retry="init()"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import paging from '@client/scripts/paging';
import { userPage } from '@client/filters/user';

export default defineComponent({
	mixins: [
		paging({}),
	],

	props: {
		title: {
			required: true
		},
		pagination: {
			required: true
		},
		extract: {
			required: false
		}
	},

	data() {
		return {
		};
	},

	methods: {
		userPage
	}
});
</script>

<style lang="scss" scoped>
.mk-users-dialog {
	width: 350px;
	height: 350px;
	background: var(--panel);
	border-radius: var(--radius);
	overflow: hidden;
	display: flex;
	flex-direction: column;

	> .header {
		display: flex;
		flex-shrink: 0;

		> button {
			height: 58px;
			width: 58px;

			@media (max-width: 500px) {
				height: 42px;
				width: 42px;
			}
		}

		> span {
			flex: 1;
			line-height: 58px;
			padding-left: 32px;
			font-weight: bold;

			@media (max-width: 500px) {
				line-height: 42px;
				padding-left: 16px;
			}
		}
	}

	> .users {
		flex: 1;
		overflow: auto;

		&:empty {
			display: none;
		}

		> .user {
			display: flex;
			align-items: center;
			font-size: 14px;
			padding: 8px 32px;

			@media (max-width: 500px) {
				padding: 8px 16px;
			}

			> * {
				pointer-events: none;
				user-select: none;
			}

			> .avatar {
				width: 45px;
				height: 45px;
			}

			> .body {
				padding: 0 8px;
				overflow: hidden;

				> .name {
					display: block;
					font-weight: bold;
				}

				> .acct {
					opacity: 0.5;
				}
			}
		}
	}

	> .empty {
		text-align: center;
		opacity: 0.5;
	}
}
</style>
