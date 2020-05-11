<template>
<x-modal ref="modal" @closed="() => { $emit('closed'); destroyDom(); }">
	<div class="mk-users-dialog">
		<div class="header">
			<span>{{ title }}</span>
			<button class="_button" @click="close()"><fa :icon="faTimes"/></button>
		</div>

		<div class="users">
			<router-link v-for="item in items" class="user" :key="item.id" :to="extract ? extract(item) : item | userPage">
				<mk-avatar :user="extract ? extract(item) : item" class="avatar" :disable-link="true"/>
				<div class="body">
					<mk-user-name :user="extract ? extract(item) : item" class="name"/>
					<mk-acct :user="extract ? extract(item) : item" class="acct"/>
				</div>
			</router-link>
		</div>
		<button class="more _button" ref="loadMore" v-if="more" @click="fetchMore" :disabled="moreFetching">
			<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
			<template v-if="moreFetching"><fa :icon="faSpinner" pulse fixed-width/></template>
		</button>

		<p class="empty" v-if="empty">{{ $t('noUsers') }}</p>

		<mk-error v-if="error" @retry="init()"/>
	</div>
</x-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import paging from '../scripts/paging';
import XModal from './modal.vue';

export default Vue.extend({
	i18n,

	components: {
		XModal
	},

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
			faTimes
		};
	},

	methods: {
		close() {
			this.$refs.modal.close();
		},
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
