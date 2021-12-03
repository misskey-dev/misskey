<template>
<div class="">
	<div class="_section" style="padding: 0;">
		<MkTab v-model="tab">
			<option value="owned">{{ $ts.ownedGroups }}</option>
			<option value="joined">{{ $ts.joinedGroups }}</option>
			<option value="invites"><i class="fas fa-envelope-open-text"></i> {{ $ts.invites }}</option>
		</MkTab>
	</div>

	<div class="_section">
		<div v-if="tab === 'owned'" class="_content">
			<MkButton primary style="margin: 0 auto var(--margin) auto;" @click="create"><i class="fas fa-plus"></i> {{ $ts.createGroup }}</MkButton>

			<MkPagination v-slot="{items}" ref="owned" :pagination="ownedPagination">
				<div v-for="group in items" :key="group.id" class="_card">
					<div class="_title"><MkA :to="`/my/groups/${ group.id }`" class="_link">{{ group.name }}</MkA></div>
					<div class="_content"><MkAvatars :user-ids="group.userIds"/></div>
				</div>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'joined'" class="_content">
			<MkPagination v-slot="{items}" ref="joined" :pagination="joinedPagination">
				<div v-for="group in items" :key="group.id" class="_card">
					<div class="_title">{{ group.name }}</div>
					<div class="_content"><MkAvatars :user-ids="group.userIds"/></div>
				</div>
			</MkPagination>
		</div>
	
		<div v-else-if="tab === 'invites'" class="_content">
			<MkPagination v-slot="{items}" ref="invitations" :pagination="invitationPagination">
				<div v-for="invitation in items" :key="invitation.id" class="_card">
					<div class="_title">{{ invitation.group.name }}</div>
					<div class="_content"><MkAvatars :user-ids="invitation.group.userIds"/></div>
					<div class="_footer">
						<MkButton primary inline @click="acceptInvite(invitation)"><i class="fas fa-check"></i> {{ $ts.accept }}</MkButton>
						<MkButton primary inline @click="rejectInvite(invitation)"><i class="fas fa-ban"></i> {{ $ts.reject }}</MkButton>
					</div>
				</div>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import MkContainer from '@/components/ui/container.vue';
import MkAvatars from '@/components/avatars.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

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
			[symbols.PAGE_INFO]: {
				title: this.$ts.groups,
				icon: 'fas fa-users'
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
		};
	},

	methods: {
		async create() {
			const { canceled, result: name } = await os.inputText({
				title: this.$ts.groupName,
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
