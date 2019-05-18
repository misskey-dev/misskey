<template>
<div class="ivrbakop">
	<ui-container v-if="group">
		<template #header><fa :icon="faUsers"/> {{ group.name }}</template>

		<section>
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
				<div class="kjlrfbes" v-for="user in users">
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
import { faICursor, faUsers, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('common/views/components/user-group-editor.vue'),

	props: {
		groupId: {
			required: true
		}
	},

	data() {
		return {
			group: null,
			users: [],
			faICursor, faTrashAlt, faUsers, faPlus
		};
	},

	created() {
		this.$root.api('users/groups/show', {
			groupId: this.groupId
		}).then(group => {
			this.group = group;
			this.fetchUsers();
			this.$emit('init', {
				title: this.group.name,
				icon: faUsers
			});
		});
	},

	methods: {
		fetchUsers() {
			this.$root.api('users/show', {
				userIds: this.group.userIds
			}).then(users => {
				this.users = users;
			});
		},

		rename() {
			this.$root.dialog({
				title: this.$t('rename'),
				input: {
					default: this.group.name
				}
			}).then(({ canceled, result: name }) => {
				if (canceled) return;
				this.$root.api('users/groups/update', {
					groupId: this.group.id,
					name: name
				});
			});
		},

		del() {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('delete-are-you-sure').replace('$1', this.group.name),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('users/groups/delete', {
					groupId: this.group.id
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
			this.$root.api('users/groups/pull', {
				groupId: this.group.id,
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
			this.$root.api('users/groups/push', {
				groupId: this.group.id,
				userId: user.id
			}).then(() => {
				this.fetchUsers();
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.ivrbakop
	.kjlrfbes
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
