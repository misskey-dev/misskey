<template>
<div class="">
	<div class="_section" style="padding: 0;">
		<MkTab v-model:value="tab">
			<option value="owned">{{ $ts.ownedGroups }}</option>
			<option value="joined">{{ $ts.joinedGroups }}</option>
			<option value="invites"><Fa :icon="faEnvelopeOpenText"/> {{ $ts.invites }}</option>
		</MkTab>
	</div>

	<div class="_section">
		<div class="_content" v-if="tab === 'owned'">
			<MkButton @click="create" primary style="margin: 0 auto var(--margin) auto;"><Fa :icon="faPlus"/> {{ $ts.createGroup }}</MkButton>

			<MkPagination :pagination="ownedPagination" #default="{items}" ref="owned">
				<div class="_card" v-for="group in items" :key="group.id">
					<div class="_title"><MkA :to="`/my/groups/${ group.id }`" class="_link">{{ group.name }}</MkA></div>
					<div class="_content"><MkAvatars :user-ids="group.userIds"/></div>
				</div>
			</MkPagination>
		</div>

		<div class="_content" v-else-if="tab === 'joined'">
			<MkPagination :pagination="joinedPagination" #default="{items}" ref="joined">
				<div class="_card" v-for="group in items" :key="group.id">
					<div class="_title">{{ group.name }}</div>
					<div class="_content"><MkAvatars :user-ids="group.userIds"/></div>
				</div>
			</MkPagination>
		</div>
	
		<div class="_content" v-else-if="tab === 'invites'">
			<MkPagination :pagination="invitationPagination" #default="{items}" ref="invitations">
				<div class="_card" v-for="invitation in items" :key="invitation.id">
					<div class="_title">{{ invitation.group.name }}</div>
					<div class="_content"><MkAvatars :user-ids="invitation.group.userIds"/></div>
					<div class="_footer">
						<MkButton @click="acceptInvite(invitation)" primary inline><Fa :icon="faCheck"/> {{ $ts.accept }}</MkButton>
						<MkButton @click="rejectInvite(invitation)" primary inline><Fa :icon="faBan"/> {{ $ts.reject }}</MkButton>
					</div>
				</div>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faUsers, faPlus, faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';
import MkPagination from '@client/components/ui/pagination.vue';
import MkButton from '@client/components/ui/button.vue';
import MkContainer from '@client/components/ui/container.vue';
import MkAvatars from '@client/components/avatars.vue';
import MkTab from '@client/components/tab.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkPagination,
		MkButton,
		MkContainer,
		MkTab,
		MkAvatars,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.groups,
				icon: faUsers
			},
			tab: 'owned',
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
			const { canceled, result: name } = await os.dialog({
				title: this.$ts.groupName,
				input: true
			});
			if (canceled) return;
			await os.api('users/groups/create', { name: name });
			this.$refs.owned.reload();
			os.success();
		},
		acceptInvite(invitation) {
			os.api('users/groups/invitations/accept', {
				invitationId: invitation.id
			}).then(() => {
				os.success();
				this.$refs.invitations.reload();
				this.$refs.joined.reload();
			});
		},
		rejectInvite(invitation) {
			os.api('users/groups/invitations/reject', {
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
