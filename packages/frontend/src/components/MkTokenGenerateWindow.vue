<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:with-ok-button="true"
	:ok-button-disabled="false"
	:can-close="false"
	@close="dialog.close()"
	@closed="$emit('closed')"
	@ok="ok()"
>
	<template #header>{{ title || $ts.generateAccessToken }}</template>

	<MkSpacer :margin-min="20" :margin-max="28">
		<div class="_gaps_m">
			<div v-if="information">
				<MkInfo warn>{{ information }}</MkInfo>
			</div>
			<div>
				<MkInput v-model="name">
					<template #label>{{ $ts.name }}</template>
				</MkInput>
			</div>
			<div><b>{{ $ts.permission }}</b></div>
			<div class="_buttons">
				<MkButton inline @click="disableAll">{{ i18n.ts.disableAll }}</MkButton>
				<MkButton inline @click="enableAll">{{ i18n.ts.enableAll }}</MkButton>
			</div>
			<MkSwitch v-for="kind in (initialPermissions || kinds)" :key="kind" v-model="permissions[kind]">{{ $t(`_permissions.${kind}`) }}</MkSwitch>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { permissions as kinds } from 'misskey-js';
import MkInput from './MkInput.vue';
import MkSwitch from './MkSwitch.vue';
import MkButton from './MkButton.vue';
import MkInfo from './MkInfo.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	title?: string | null;
	information?: string | null;
	initialName?: string | null;
	initialPermissions?: string[] | null;
}>(), {
	title: null,
	information: null,
	initialName: null,
	initialPermissions: null,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'done', result: { name: string | null, permissions: string[] }): void;
}>();

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();
let name = $ref(props.initialName);
let permissions = $ref({});

if (props.initialPermissions) {
	for (const kind of props.initialPermissions) {
		permissions[kind] = true;
	}
} else {
	for (const kind of kinds) {
		permissions[kind] = false;
	}
}

function ok(): void {
	emit('done', {
		name: name,
		permissions: Object.keys(permissions).filter(p => permissions[p]),
	});
	dialog.close();
}

function disableAll(): void {
	for (const p in permissions) {
		permissions[p] = false;
	}
}

function enableAll(): void {
	for (const p in permissions) {
		permissions[p] = true;
	}
}
</script>
