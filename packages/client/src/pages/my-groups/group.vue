<template>
<div class="mk-group-page">
	<transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
		<div v-if="group" class="_section">
			<div class="_content" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
				<MkButton inline @click="invite()">{{ $ts.invite }}</MkButton>
				<MkButton inline @click="renameGroup()">{{ $ts.rename }}</MkButton>
				<MkButton inline @click="transfer()">{{ $ts.transfer }}</MkButton>
				<MkButton inline @click="deleteGroup()">{{ $ts.delete }}</MkButton>
			</div>
		</div>
	</transition>

	<transition :name="$store.state.animation ? 'zoom' : ''" mode="out-in">
		<div v-if="group" class="_section members _gap">
			<div class="_title">{{ $ts.members }}</div>
			<div class="_content">
				<div class="users">
					<div v-for="user in users" :key="user.id" class="user _panel">
						<MkAvatar :user="user" class="avatar" :show-indicator="true"/>
						<div class="body">
							<MkUserName :user="user" class="name"/>
							<MkAcct :user="user" class="acct"/>
						</div>
						<div class="action">
							<button class="_button" @click="removeUser(user)"><i class="fas fa-times"></i></button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton
	},

	props: {
		groupId: {
			type: String,
			required: true,
		},
	},

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.group ? {
				title: this.group.name,
				icon: 'fas fa-users',
			} : null),
			group: null,
			users: [],
		};
	},

	watch: {
		groupId: 'fetch',
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			os.api('users/groups/show', {
				groupId: this.groupId
			}).then(group => {
				this.group = group;
				os.api('users/show', {
					userIds: this.group.userIds
				}).then(users => {
					this.users = users;
				});
			});
		},

		invite() {
			os.selectUser().then(user => {
				os.apiWithDialog('users/groups/invite', {
					groupId: this.group.id,
					userId: user.id
				});
			});
		},

		removeUser(user) {
			os.api('users/groups/pull', {
				groupId: this.group.id,
				userId: user.id
			}).then(() => {
				this.users = this.users.filter(x => x.id !== user.id);
			});
		},

		async renameGroup() {
			const { canceled, result: name } = await os.inputText({
				title: this.$ts.groupName,
				default: this.group.name
			});
			if (canceled) return;

			await os.api('users/groups/update', {
				groupId: this.group.id,
				name: name
			});

			this.group.name = name;
		},

		transfer() {
			os.selectUser().then(user => {
				os.apiWithDialog('users/groups/transfer', {
					groupId: this.group.id,
					userId: user.id
				});
			});
		},

		async deleteGroup() {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.group.name }),
			});
			if (canceled) return;

			await os.apiWithDialog('users/groups/delete', {
				groupId: this.group.id
			});
			this.$router.push('/my/groups');
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-group-page {
	> .members {
		> ._content {
			> .users {
				> .user {
					display: flex;
					align-items: center;
					padding: 16px;

					> .avatar {
						width: 50px;
						height: 50px;
					}

					> .body {
						flex: 1;
						padding: 8px;

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
		}
	}
}
</style>
