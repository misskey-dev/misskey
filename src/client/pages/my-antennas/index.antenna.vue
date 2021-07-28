<template>
<div class="shaynizk _card">
	<div class="_title" v-if="antenna.name">{{ antenna.name }}</div>
	<div class="_content body">
		<MkInput v-model:value="name">
			<span>{{ $ts.name }}</span>
		</MkInput>
		<MkSelect v-model:value="src">
			<template #label>{{ $ts.antennaSource }}</template>
			<option value="all">{{ $ts._antennaSources.all }}</option>
			<option value="home">{{ $ts._antennaSources.homeTimeline }}</option>
			<option value="users">{{ $ts._antennaSources.users }}</option>
			<option value="list">{{ $ts._antennaSources.userList }}</option>
			<option value="group">{{ $ts._antennaSources.userGroup }}</option>
		</MkSelect>
		<MkSelect v-model:value="userListId" v-if="src === 'list'">
			<template #label>{{ $ts.userList }}</template>
			<option v-for="list in userLists" :value="list.id" :key="list.id">{{ list.name }}</option>
		</MkSelect>
		<MkSelect v-model:value="userGroupId" v-else-if="src === 'group'">
			<template #label>{{ $ts.userGroup }}</template>
			<option v-for="group in userGroups" :value="group.id" :key="group.id">{{ group.name }}</option>
		</MkSelect>
		<MkTextarea v-model:value="users" v-else-if="src === 'users'">
			<span>{{ $ts.users }}</span>
			<template #desc>{{ $ts.antennaUsersDescription }} <button class="_textButton" @click="addUser">{{ $ts.addUser }}</button></template>
		</MkTextarea>
		<MkSwitch v-model:value="withReplies">{{ $ts.withReplies }}</MkSwitch>
		<MkTextarea v-model:value="keywords">
			<span>{{ $ts.antennaKeywords }}</span>
			<template #desc>{{ $ts.antennaKeywordsDescription }}</template>
		</MkTextarea>
		<MkTextarea v-model:value="excludeKeywords">
			<span>{{ $ts.antennaExcludeKeywords }}</span>
			<template #desc>{{ $ts.antennaKeywordsDescription }}</template>
		</MkTextarea>
		<MkSwitch v-model:value="caseSensitive">{{ $ts.caseSensitive }}</MkSwitch>
		<MkSwitch v-model:value="withFile">{{ $ts.withFileAntenna }}</MkSwitch>
		<MkSwitch v-model:value="notify">{{ $ts.notifyAntenna }}</MkSwitch>
	</div>
	<div class="_footer">
		<MkButton inline @click="saveAntenna()" primary><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
		<MkButton inline @click="deleteAntenna()" v-if="antenna.id != null"><i class="fas fa-trash"></i> {{ $ts.delete }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkTextarea from '@client/components/ui/textarea.vue';
import MkSelect from '@client/components/ui/select.vue';
import MkSwitch from '@client/components/ui/switch.vue';
import { getAcct } from '@/misc/acct';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkButton, MkInput, MkTextarea, MkSelect, MkSwitch
	},

	props: {
		antenna: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			name: '',
			src: '',
			userListId: null,
			userGroupId: null,
			users: '',
			keywords: '',
			excludeKeywords: '',
			caseSensitive: false,
			withReplies: false,
			withFile: false,
			notify: false,
			userLists: null,
			userGroups: null,
		};
	},

	watch: {
		async src() {
			if (this.src === 'list' && this.userLists === null) {
				this.userLists = await os.api('users/lists/list');
			}

			if (this.src === 'group' && this.userGroups === null) {
				const groups1 = await os.api('users/groups/owned');
				const groups2 = await os.api('users/groups/joined');

				this.userGroups = [...groups1, ...groups2];
			}
		}
	},

	created() {
		this.name = this.antenna.name;
		this.src = this.antenna.src;
		this.userListId = this.antenna.userListId;
		this.userGroupId = this.antenna.userGroupId;
		this.users = this.antenna.users.join('\n');
		this.keywords = this.antenna.keywords.map(x => x.join(' ')).join('\n');
		this.excludeKeywords = this.antenna.excludeKeywords.map(x => x.join(' ')).join('\n');
		this.caseSensitive = this.antenna.caseSensitive;
		this.withReplies = this.antenna.withReplies;
		this.withFile = this.antenna.withFile;
		this.notify = this.antenna.notify;
	},

	methods: {
		async saveAntenna() {
			if (this.antenna.id == null) {
				await os.api('antennas/create', {
					name: this.name,
					src: this.src,
					userListId: this.userListId,
					userGroupId: this.userGroupId,
					withReplies: this.withReplies,
					withFile: this.withFile,
					notify: this.notify,
					caseSensitive: this.caseSensitive,
					users: this.users.trim().split('\n').map(x => x.trim()),
					keywords: this.keywords.trim().split('\n').map(x => x.trim().split(' ')),
					excludeKeywords: this.excludeKeywords.trim().split('\n').map(x => x.trim().split(' ')),
				});
				this.$emit('created');
			} else {
				await os.api('antennas/update', {
					antennaId: this.antenna.id,
					name: this.name,
					src: this.src,
					userListId: this.userListId,
					userGroupId: this.userGroupId,
					withReplies: this.withReplies,
					withFile: this.withFile,
					notify: this.notify,
					caseSensitive: this.caseSensitive,
					users: this.users.trim().split('\n').map(x => x.trim()),
					keywords: this.keywords.trim().split('\n').map(x => x.trim().split(' ')),
					excludeKeywords: this.excludeKeywords.trim().split('\n').map(x => x.trim().split(' ')),
				});
			}

			os.success();
		},

		async deleteAntenna() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.antenna.name }),
				showCancelButton: true
			});
			if (canceled) return;

			await os.api('antennas/delete', {
				antennaId: this.antenna.id,
			});

			os.success();
			this.$emit('deleted');
		},

		addUser() {
			os.selectUser().then(user => {
				this.users = this.users.trim();
				this.users += '\n@' + getAcct(user);
				this.users = this.users.trim();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.shaynizk {
	> .body {
		max-height: 250px;
		overflow: auto;
	}
}
</style>
