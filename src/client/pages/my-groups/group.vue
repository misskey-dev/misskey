<template>
<div class="mk-group-page">
	<portal to="header"><Fa :icon="faUsers"/>{{ group.name }}</portal>

	<transition name="zoom" mode="out-in">
		<div v-if="group" class="_section">
			<div class="_content">
				<MkButton inline @click="renameGroup()">{{ $t('rename') }}</MkButton>
				<MkButton inline @click="transfer()">{{ $t('transfer') }}</MkButton>
				<MkButton inline @click="deleteGroup()">{{ $t('delete') }}</MkButton>
			</div>
		</div>
	</transition>

	<transition name="zoom" mode="out-in">
		<div v-if="group" class="_section members _vMargin">
			<div class="_title">{{ $t('members') }}</div>
			<div class="_content">
				<div class="users">
					<div class="user" v-for="user in users" :key="user.id">
						<MkAvatar :user="user" class="avatar"/>
						<div class="body">
							<MkUserName :user="user" class="name"/>
							<MkAcct :user="user" class="acct"/>
						</div>
						<div class="action">
							<button class="_button" @click="removeUser(user)"><Fa :icon="faTimes"/></button>
						</div>
					</div>
				</div>
			</div>
			<div class="_footer">
				<MkButton inline @click="invite()">{{ $t('invite') }}</MkButton>
			</div>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTimes, faUsers } from '@fortawesome/free-solid-svg-icons';
import Progress from '@/scripts/loading';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	metaInfo() {
		return {
			title: this.group ? `${this.group.name} | ${this.$t('manageGroups')}` : this.$t('manageGroups')
		};
	},

	components: {
		MkButton
	},

	data() {
		return {
			group: null,
			users: [],
			faTimes, faUsers
		};
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			Progress.start();
			os.api('users/groups/show', {
				groupId: this.$route.params.group
			}).then(group => {
				this.group = group;
				os.api('users/show', {
					userIds: this.group.userIds
				}).then(users => {
					this.users = users;
					Progress.done();
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
			const { canceled, result: name } = await os.dialog({
				title: this.$t('groupName'),
				input: {
					default: this.group.name
				}
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
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.group.name }),
				showCancelButton: true
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
			max-height: 400px;
			overflow: auto;

			> .users {
				> .user {
					display: flex;
					align-items: center;

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
