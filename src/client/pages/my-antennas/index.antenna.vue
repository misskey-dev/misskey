<template>
<div class="shaynizk _card">
	<div class="_title" v-if="antenna.name">{{ antenna.name }}</div>
	<div class="_content body">
		<mk-input v-model:value="name">
			<span>{{ $t('name') }}</span>
		</mk-input>
		<mk-select v-model:value="src">
			<template #label>{{ $t('antennaSource') }}</template>
			<option value="all">{{ $t('_antennaSources.all') }}</option>
			<option value="home">{{ $t('_antennaSources.homeTimeline') }}</option>
			<option value="users">{{ $t('_antennaSources.users') }}</option>
			<option value="list">{{ $t('_antennaSources.userList') }}</option>
			<option value="group">{{ $t('_antennaSources.userGroup') }}</option>
		</mk-select>
		<mk-select v-model:value="userListId" v-if="src === 'list'">
			<template #label>{{ $t('userList') }}</template>
			<option v-for="list in userLists" :value="list.id" :key="list.id">{{ list.name }}</option>
		</mk-select>
		<mk-select v-model:value="userGroupId" v-else-if="src === 'group'">
			<template #label>{{ $t('userGroup') }}</template>
			<option v-for="group in userGroups" :value="group.id" :key="group.id">{{ group.name }}</option>
		</mk-select>
		<mk-textarea v-model:value="users" v-else-if="src === 'users'">
			<span>{{ $t('users') }}</span>
			<template #desc>{{ $t('antennaUsersDescription') }} <button class="_textButton" @click="addUser">{{ $t('addUser') }}</button></template>
		</mk-textarea>
		<mk-switch v-model:value="withReplies">{{ $t('withReplies') }}</mk-switch>
		<mk-textarea v-model:value="keywords">
			<span>{{ $t('antennaKeywords') }}</span>
			<template #desc>{{ $t('antennaKeywordsDescription') }}</template>
		</mk-textarea>
		<mk-textarea v-model:value="excludeKeywords">
			<span>{{ $t('antennaExcludeKeywords') }}</span>
			<template #desc>{{ $t('antennaKeywordsDescription') }}</template>
		</mk-textarea>
		<mk-switch v-model:value="caseSensitive">{{ $t('caseSensitive') }}</mk-switch>
		<mk-switch v-model:value="withFile">{{ $t('withFileAntenna') }}</mk-switch>
		<mk-switch v-model:value="notify">{{ $t('notifyAntenna') }}</mk-switch>
	</div>
	<div class="_footer">
		<mk-button inline @click="saveAntenna()" primary><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		<mk-button inline @click="deleteAntenna()" v-if="antenna.id != null"><fa :icon="faTrash"/> {{ $t('delete') }}</mk-button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSave, faTrash } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkSelect from '@/components/ui/select.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkUserSelect from '@/components/user-select.vue';
import getAcct from '../../../misc/acct/render';
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
			faSave, faTrash
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

			os.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
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

			os.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
			this.$emit('deleted');
		},

		addUser() {
			this.$root.new(MkUserSelect, {}).$once('selected', user => {
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
