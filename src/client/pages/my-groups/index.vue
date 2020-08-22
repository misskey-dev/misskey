<template>
<div class="">
	<teleport to="#_teleport_header"><fa :icon="faUsers"/>{{ $t('groups') }}</teleport>

	<mk-button @click="create" primary style="margin: 0 auto var(--margin) auto;"><fa :icon="faPlus"/> {{ $t('createGroup') }}</mk-button>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faUsers"/> {{ $t('ownedGroups') }}</template>
		<mk-pagination :pagination="ownedPagination" #default="{items}" ref="owned">
			<div class="_card" v-for="group in items" :key="group.id">
				<div class="_title"><router-link :to="`/my/groups/${ group.id }`" class="_link">{{ group.name }}</router-link></div>
				<div class="_content"><mk-avatars :user-ids="group.userIds"/></div>
			</div>
		</mk-pagination>
	</mk-container>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faEnvelopeOpenText"/> {{ $t('invites') }}</template>
		<mk-pagination :pagination="invitationPagination" #default="{items}" ref="invitations">
			<div class="_card" v-for="invitation in items" :key="invitation.id">
				<div class="_title">{{ invitation.group.name }}</div>
				<div class="_content"><mk-avatars :user-ids="invitation.group.userIds"/></div>
				<div class="_footer">
					<mk-button @click="acceptInvite(invitation)" primary inline><fa :icon="faCheck"/> {{ $t('accept') }}</mk-button>
					<mk-button @click="rejectInvite(invitation)" primary inline><fa :icon="faBan"/> {{ $t('reject') }}</mk-button>
				</div>
			</div>
		</mk-pagination>
	</mk-container>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faUsers"/> {{ $t('joinedGroups') }}</template>
		<mk-pagination :pagination="joinedPagination" #default="{items}" ref="joined">
			<div class="_card" v-for="group in items" :key="group.id">
				<div class="_title">{{ group.name }}</div>
				<div class="_content"><mk-avatars :user-ids="group.userIds"/></div>
			</div>
		</mk-pagination>
	</mk-container>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faUsers, faPlus, faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '../../components/ui/pagination.vue';
import MkButton from '../../components/ui/button.vue';
import MkContainer from '../../components/ui/container.vue';
import MkAvatars from '../../components/avatars.vue';

export default defineComponent({
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
			invitationPagination: {
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
		acceptInvite(invitation) {
			this.$root.api('users/groups/invitations/accept', {
				invitationId: invitation.id
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
				this.$refs.invitations.reload();
				this.$refs.joined.reload();
			});
		},
		rejectInvite(invitation) {
			this.$root.api('users/groups/invitations/reject', {
				invitationId: invitation.id
			}).then(() => {
				this.$refs.invitations.reload();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
</style>
