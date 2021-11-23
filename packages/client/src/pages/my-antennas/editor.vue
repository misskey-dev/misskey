<template>
<div class="shaynizk">
	<div class="form">
		<MkInput v-model="name" class="_formBlock">
			<template #label>{{ $ts.name }}</template>
		</MkInput>
		<MkSelect v-model="src" class="_formBlock">
			<template #label>{{ $ts.antennaSource }}</template>
			<option value="all">{{ $ts._antennaSources.all }}</option>
			<option value="home">{{ $ts._antennaSources.homeTimeline }}</option>
			<option value="users">{{ $ts._antennaSources.users }}</option>
			<option value="list">{{ $ts._antennaSources.userList }}</option>
			<option value="group">{{ $ts._antennaSources.userGroup }}</option>
		</MkSelect>
		<MkSelect v-if="src === 'list'" v-model="userListId" class="_formBlock">
			<template #label>{{ $ts.userList }}</template>
			<option v-for="list in userLists" :key="list.id" :value="list.id">{{ list.name }}</option>
		</MkSelect>
		<MkSelect v-else-if="src === 'group'" v-model="userGroupId" class="_formBlock">
			<template #label>{{ $ts.userGroup }}</template>
			<option v-for="group in userGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
		</MkSelect>
		<MkTextarea v-else-if="src === 'users'" v-model="users" class="_formBlock">
			<template #label>{{ $ts.users }}</template>
			<template #caption>{{ $ts.antennaUsersDescription }} <button class="_textButton" @click="addUser">{{ $ts.addUser }}</button></template>
		</MkTextarea>
		<MkSwitch v-model="withReplies" class="_formBlock">{{ $ts.withReplies }}</MkSwitch>
		<MkTextarea v-model="keywords" class="_formBlock">
			<template #label>{{ $ts.antennaKeywords }}</template>
			<template #caption>{{ $ts.antennaKeywordsDescription }}</template>
		</MkTextarea>
		<MkTextarea v-model="excludeKeywords" class="_formBlock">
			<template #label>{{ $ts.antennaExcludeKeywords }}</template>
			<template #caption>{{ $ts.antennaKeywordsDescription }}</template>
		</MkTextarea>
		<MkSwitch v-model="caseSensitive" class="_formBlock">{{ $ts.caseSensitive }}</MkSwitch>
		<MkSwitch v-model="withFile" class="_formBlock">{{ $ts.withFileAntenna }}</MkSwitch>
		<MkSwitch v-model="notify" class="_formBlock">{{ $ts.notifyAntenna }}</MkSwitch>
	</div>
	<div class="actions">
		<MkButton inline primary @click="saveAntenna()"><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
		<MkButton v-if="antenna.id != null" inline danger @click="deleteAntenna()"><i class="fas fa-trash"></i> {{ $ts.delete }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkSelect from '@/components/form/select.vue';
import MkSwitch from '@/components/form/switch.vue';
import * as Acct from 'misskey-js/built/acct';
import * as os from '@/os';

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
				await os.apiWithDialog('antennas/create', {
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
				await os.apiWithDialog('antennas/update', {
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
				this.$emit('updated');
			}
		},

		async deleteAntenna() {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.antenna.name }),
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
				this.users += '\n@' + Acct.toString(user);
				this.users = this.users.trim();
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.shaynizk {
	> .form {
		padding: 32px;
	}

	> .actions {
		padding: 24px 32px;
		border-top: solid 0.5px var(--divider);
	}
}
</style>
