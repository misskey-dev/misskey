<template>
<div class="">
	<portal to="icon"><fa :icon="faUsers"/></portal>
	<portal to="title">{{ $t('groups') }}</portal>

	<mk-button @click="create" primary style="margin: 0 auto var(--margin) auto;"><fa :icon="faPlus"/> {{ $t('createGroup') }}</mk-button>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faUsers"/> {{ $t('ownedGroups') }}</template>
		<mk-pagination :pagination="ownedPagination" #default="{items}" ref="owned">
			<div class="" v-for="group in items" :key="group.id">
				<router-link :to="`/my/groups/${ group.id }`">{{ group.name }}</router-link>
			</div>
		</mk-pagination>
	</mk-container>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faEnvelopeOpenText"/> {{ $t('invites') }}</template>
		<mk-pagination :pagination="invitePagination" #default="{items}">
			<div class="" v-for="invite in items" :key="invite.id">
				<div class="name">{{ invite.group.name }}</div>
				<x-avatars :user-ids="invite.group.userIds" style="margin-top:8px;"/>
				<ui-horizon-group>
					<ui-button @click="acceptInvite(invite)"><fa :icon="faCheck"/> {{ $t('accept') }}</ui-button>
					<ui-button @click="rejectInvite(invite)"><fa :icon="faBan"/> {{ $t('reject') }}</ui-button>
				</ui-horizon-group>
			</div>
		</mk-pagination>
	</mk-container>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faUsers"/> {{ $t('joinedGroups') }}</template>
		<mk-pagination :pagination="joinedPagination" #default="{items}">
			<div class="" v-for="group in items" :key="group.id">
				<div>{{ group.name }}</div>
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
	}
});
</script>

<style lang="scss" scoped>
</style>
