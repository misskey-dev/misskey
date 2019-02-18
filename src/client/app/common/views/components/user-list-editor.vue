<template>
<div class="cudqjmnl">
	<ui-card>
		<template #title><fa :icon="faList"/> {{ list.title }}</template>

		<section>
			<ui-button @click="rename"><fa :icon="faICursor"/> {{ $t('rename') }}</ui-button>
			<ui-button @click="del"><fa :icon="faTrashAlt"/> {{ $t('delete') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faUsers"/> {{ $t('users') }}</template>

		<section>
			<sequential-entrance animation="entranceFromTop" delay="25">
				<div class="phcqulfl" v-for="user in users">
					<div>
						<a :href="user | userPage">
							<mk-avatar class="avatar" :user="user" :disable-link="true"/>
						</a>
					</div>
					<div>
						<header>
							<b><mk-user-name :user="user"/></b>
							<span class="username">@{{ user | acct }}</span>
						</header>
						<div>
							<a @click="remove(user)">{{ $t('remove-user') }}</a>
						</div>
					</div>
				</div>
			</sequential-entrance>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faList, faICursor, faUsers } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/user-list-editor.vue'),

	props: {
		list: {
			required: true
		}
	},

	data() {
		return {
			users: [],
			faList, faICursor, faTrashAlt, faUsers
		};
	},

	mounted() {
		this.fetchUsers();
	},

	methods: {
		fetchUsers() {
			this.$root.api('users/show', {
				userIds: this.list.userIds
			}).then(users => {
				this.users = users;
			});
		},

		rename() {
			this.$root.dialog({
				title: this.$t('rename'),
				input: {
					default: this.list.title
				}
			}).then(({ canceled, result: title }) => {
				if (canceled) return;
				this.$root.api('users/lists/update', {
					listId: this.list.id,
					title: title
				});
			});
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('delete-are-you-sure').replace('$1', this.list.title),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('users/lists/delete', {
					listId: this.list.id
				}).then(() => {
					this.$root.dialog({
						type: 'success',
						text: this.$t('deleted')
					});
				}).catch(e => {
					this.$root.dialog({
						type: 'error',
						text: e
					});
				});
			});
		},

		remove(user: any) {
			this.$root.api('users/lists/pull', {
				listId: this.list.id,
				userId: user.id
			}).then(() => {
				this.fetchUsers();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.cudqjmnl
	.phcqulfl
		display flex
		padding 16px 0
		border-top solid 1px var(--faceDivider)

		> div:first-child
			> a
				> .avatar
					width 64px
					height 64px

		> div:last-child
			flex 1
			padding-left 16px

			@media (max-width 500px)
				font-size 14px

			> header
				> .username
					margin-left 8px
					opacity 0.7

</style>
