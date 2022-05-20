<template>
<div class="shaynizk">
	<div class="form">
		<MkInput v-model="name" class="_formBlock">
			<template #label>{{ $ts.name }}</template>
		</MkInput>
		<MkSelect v-model="src" class="_formBlock">
			<template #label>{{ $ts.antennaSource }}</template>
			<option value="all">{{ $ts._antennaSources.all }}</option>
			<!--<option value="home">{{ $ts._antennaSources.homeTimeline }}</option>-->
			<option value="users">{{ $ts._antennaSources.users }}</option>
			<!--<option value="list">{{ $ts._antennaSources.userList }}</option>-->
			<!--<option value="group">{{ $ts._antennaSources.userGroup }}</option>-->
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

<script lang="ts" setup>
import { watch } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkSelect from '@/components/form/select.vue';
import MkSwitch from '@/components/form/switch.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	antenna: any
}>();

const emit = defineEmits<{
	(ev: 'created'): void,
	(ev: 'updated'): void,
	(ev: 'deleted'): void,
}>();

let name: string = $ref(props.antenna.name);
let src: string = $ref(props.antenna.src);
let userListId: any = $ref(props.antenna.userListId);
let userGroupId: any = $ref(props.antenna.userGroupId);
let users: string = $ref(props.antenna.users.join('\n'));
let keywords: string = $ref(props.antenna.keywords.map(x => x.join(' ')).join('\n'));
let excludeKeywords: string = $ref(props.antenna.excludeKeywords.map(x => x.join(' ')).join('\n'));
let caseSensitive: boolean = $ref(props.antenna.caseSensitive);
let withReplies: boolean = $ref(props.antenna.withReplies);
let withFile: boolean = $ref(props.antenna.withFile);
let notify: boolean = $ref(props.antenna.notify);
let userLists: any = $ref(null);
let userGroups: any = $ref(null);

watch(() => src, async () => {
	if (src === 'list' && userLists === null) {
		userLists = await os.api('users/lists/list');
	}

	if (src === 'group' && userGroups === null) {
		const groups1 = await os.api('users/groups/owned');
		const groups2 = await os.api('users/groups/joined');

		userGroups = [...groups1, ...groups2];
	}
});

async function saveAntenna() {
	const antennaData = {
		name,
		src,
		userListId,
		userGroupId,
		withReplies,
		withFile,
		notify,
		caseSensitive,
		users: users.trim().split('\n').map(x => x.trim()),
		keywords: keywords.trim().split('\n').map(x => x.trim().split(' ')),
		excludeKeywords: excludeKeywords.trim().split('\n').map(x => x.trim().split(' ')),
	};

	if (props.antenna.id == null) {
		await os.apiWithDialog('antennas/create', antennaData);
		emit('created');
	} else {
		antennaData['antennaId'] = props.antenna.id;
		await os.apiWithDialog('antennas/update', antennaData);
		emit('updated');
	}
}

async function deleteAntenna() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: props.antenna.name }),
	});
	if (canceled) return;

	await os.api('antennas/delete', {
		antennaId: props.antenna.id,
	});

	os.success();
	emit('deleted');
}

function addUser() {
	os.selectUser().then(user => {
		users = users.trim();
		users += '\n@' + Acct.toString(user as any);
		users = users.trim();
	});
}
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
