<template>
<div class="">
	<portal to="icon"><fa :icon="faUsers"/></portal>
	<portal to="title">{{ $t('groups') }}</portal>

	<mk-button @click="create" primary style="margin: 0 auto var(--margin) auto;"><fa :icon="faPlus"/> {{ $t('createGroup') }}</mk-button>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faUsers"/> {{ $t('ownedGroups') }}</template>
		<mk-pagination :pagination="ownedPagination" #default="{items}" ref="owned">
			<div class="_frame" v-for="group in items" :key="group.id">
				<div class="_title"><router-link :to="`/my/groups/${ group.id }`" class="_link">{{ group.name }}</router-link></div>
				<div class="_content"><mk-avatars :user-ids="group.userIds"/></div>
			</div>
		</mk-pagination>
	</mk-container>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faEnvelopeOpenText"/> {{ $t('invites') }}</template>
		<mk-pagination :pagination="invitePagination" #default="{items}" ref="invites">
			<div class="_frame" v-for="invite in items" :key="invite.id">
				<div class="_title">{{ invite.group.name }}</div>
				<div class="_content"><mk-avatars :user-ids="invite.group.userIds"/></div>
				<div class="_footer">
					<mk-button @click="acceptInvite(invite)" primary inline><fa :icon="faCheck"/> {{ $t('accept') }}</mk-button>
					<mk-button @click="rejectInvite(invite)" primary inline><fa :icon="faBan"/> {{ $t('reject') }}</mk-button>
				</div>
			</div>
		</mk-pagination>
	</mk-container>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faUsers"/> {{ $t('joinedGroups') }}</template>
		<mk-pagination :pagination="joinedPagination" #default="{items}" ref="joined">
			<div class="_frame" v-for="group in items" :key="group.id">
				<div class="_title">{{ group.name }}</div>
				<div class="_content"><mk-avatars :user-ids="group.userIds"/></div>
			</div>
		</mk-pagination>
	</mk-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faUsers, faPlus, faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '../../components/ui/pagination.vue';
import MkButton from '../../components/ui/button.vue';
import MkContainer from '../../components/ui/container.vue';
import MkAvatars from '../../components/avatars.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('groups') as string,
		};
	},

	components: {
		MkPagination,
		MkButton,
		MkContainer,
		MkAvatars,
	},

	data() {
		return {
			ownedPagination: {
				endpoint: 'users/groups/owned',
				limit: 10,
			},
			joinedPagination: {
				endpoint: 'users/groups/joined',
				limit: 10,
			},
			invitePagination: {
				endpoint: 'i/user-group-invites',
				limit: 10,
			},
			faUsers, faPlus, faEnvelopeOpenText
		};
	},

	methods: {
		async create() {
			const { canceled, result: name } = await this.$root.dialog({
				title: this.$t('groupName'),
				input: true
			});
			if (canceled) return;
			await this.$root.api('users/groups/create', { name: name });
			this.$refs.owned.reload();
			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},
		acceptInvite(invite) {
			this.$root.api('users/groups/invitations/accept', {
				inviteId: invite.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
				this.$refs.invites.reload();
				this.$refs.joined.reload();
			});
		},
		rejectInvite(invite) {
			this.$root.api('users/groups/invitations/reject', {
				inviteId: invite.id
			}).then(() => {
				this.$refs.invites.reload();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
