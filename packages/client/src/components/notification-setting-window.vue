<template>
<XModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:with-ok-button="true"
	:ok-button-disabled="false"
	@ok="ok()"
	@close="dialog.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.notificationSetting }}</template>
	<div class="_monolithic_">
		<div v-if="showGlobalToggle" class="_section">
			<MkSwitch v-model="useGlobalSetting">
				{{ i18n.ts.useGlobalSetting }}
				<template #caption>{{ i18n.ts.useGlobalSettingDesc }}</template>
			</MkSwitch>
		</div>
		<div v-if="!useGlobalSetting" class="_section">
			<MkInfo>{{ i18n.ts.notificationSettingDesc }}</MkInfo>
			<MkButton inline @click="disableAll">{{ i18n.ts.disableAll }}</MkButton>
			<MkButton inline @click="enableAll">{{ i18n.ts.enableAll }}</MkButton>
			<MkSwitch v-for="type in notificationTypes" :key="type" v-model="typesMap[type]">{{ i18n.t(`_notification._types.${type}`) }}</MkSwitch>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts" setup>
import { PropType } from 'vue';
import { notificationTypes } from 'misskey-js';
import MkSwitch from './form/switch.vue';
import MkInfo from './ui/info.vue';
import MkButton from './ui/button.vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import { i18n } from '@/i18n';

const emit = defineEmits<{
	(ev: 'done', v: { includingTypes: string[] }): void,
	(ev: 'closed'): void,
}>();

const props = withDefaults(defineProps<{
	// TODO: これで型に合わないものを弾いてくれるのかどうか要調査
	includingTypes?: typeof notificationTypes[number][];
	showGlobalToggle?: boolean;
}>(), {
	includingTypes: () => [],
	showGlobalToggle: true,
});

const dialog = $ref<InstanceType<typeof XModalWindow>>();

let typesMap = $ref<Record<typeof notificationTypes[number], boolean>>({});
let useGlobalSetting = $ref(props.includingTypes === [] && props.showGlobalToggle);

for (const type of notificationTypes) {
	typesMap[type] = props.includingTypes.includes(type);
}

function ok() {
	if (useGlobalSetting) {
		emit('done', { includingTypes: null });
	} else {
		emit('done', {
			includingTypes: (Object.keys(typesMap) as typeof notificationTypes[number][])
				.filter(type => typesMap[type]),
		});
	}

	dialog.close();
}

function disableAll() {
	for (const type in typesMap) {
		typesMap[type as typeof notificationTypes[number]] = false;
	}
}

function enableAll() {
	for (const type in typesMap) {
		typesMap[type as typeof notificationTypes[number]] = true;
	}
}
</script>
