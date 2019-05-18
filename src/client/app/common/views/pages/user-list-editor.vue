<template>
<div class="cudqjmnl">
	<ui-container v-if="list">
		<template #header><fa :icon="faListUl"/> {{ list.name }}</template>

		<section class="fwvevrks">
			<ui-margin>
				<ui-button @click="rename"><fa :icon="faICursor"/> {{ $t('rename') }}</ui-button>
				<ui-button @click="del"><fa :icon="faTrashAlt"/> {{ $t('delete') }}</ui-button>
			</ui-margin>
		</section>
	</ui-container>

	<ui-container>
		<template #header><fa :icon="faUsers"/> {{ $t('users') }}</template>

		<section>
			<ui-margin>
				<ui-button @click="add"><fa :icon="faPlus"/> {{ $t('add-user') }}</ui-button>
			</ui-margin>
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
	</ui-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faListUl, faICursor, faUsers, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/user-list-editor.vue'),

	props: {
		listId: {
			required: true
		}
	},

	data() {
		return {
			list: null,
			users: [],
			faListUl, faICursor, faTrashAlt, faUsers, faPlus
		};
	},

	created() {
		this.$root.api('users/lists/show', {
			listId: this.listId
		}).then(list => {
			this.list = list;
			this.fetchUsers();
			this.$emit('init', {
				title: this.list.name,
				icon: faListUl
			});
		});
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
					default: this.list.name
				}
			}).then(({ canceled, result: name }) => {
				if (canceled) return;
				this.$root.api('users/lists/update', {
					listId: this.list.id,
					name: name
				});
			});
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('delete-are-you-sure').replace('$1', this.list.name),
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
		},

		async add() {
			const { result: user } = await this.$root.dialog({
				user: {
					local: true
				}
			});
			if (user == null) return;
			this.$root.api('users/lists/push', {
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
		padding 16px
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
				color var(--text)

				> .username
					margin-left 8px
					opacity 0.7

</style>
