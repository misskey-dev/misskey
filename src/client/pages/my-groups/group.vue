<template>
<div class="mk-group-page">
	<portal to="header"><fa :icon="faUsers"/>{{ group.name }}</portal>

	<transition name="zoom" mode="out-in">
		<div v-if="group" class="_card _vMargin">
			<div class="_content">
				<mk-button inline @click="renameGroup()">{{ $t('rename') }}</mk-button>
				<mk-button inline @click="transfer()">{{ $t('transfer') }}</mk-button>
				<mk-button inline @click="deleteGroup()">{{ $t('delete') }}</mk-button>
			</div>
		</div>
	</transition>

	<transition name="zoom" mode="out-in">
		<div v-if="group" class="_card members _vMargin">
			<div class="_title">{{ $t('members') }}</div>
			<div class="_content">
				<div class="users">
					<div class="user" v-for="user in users" :key="user.id">
						<mk-avatar :user="user" class="avatar"/>
						<div class="body">
							<mk-user-name :user="user" class="name"/>
							<mk-acct :user="user" class="acct"/>
						</div>
						<div class="action">
							<button class="_button" @click="removeUser(user)"><fa :icon="faTimes"/></button>
						</div>
					</div>
				</div>
			</div>
			<div class="_footer">
				<mk-button inline @click="invite()">{{ $t('invite') }}</mk-button>
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
import MkUserSelect from '@/components/user-select.vue';
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
			os.modal(MkUserSelect, {}).$once('selected', user => {
				os.api('users/groups/invite', {
					groupId: this.group.id,
					userId: user.id
				}).then(() => {
					os.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				}).catch(e => {
					os.dialog({
						type: 'error',
						text: e
					});
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
			os.modal(MkUserSelect, {}).$once('selected', user => {
				os.api('users/groups/transfer', {
					groupId: this.group.id,
					userId: user.id
				}).then(() => {
					os.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				}).catch(e => {
					os.dialog({
						type: 'error',
						text: e
					});
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

			await os.api('users/groups/delete', {
				groupId: this.group.id
			});
			os.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
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
