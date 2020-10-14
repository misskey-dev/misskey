<template>
<XModalWindow ref="dialog"
	:width="400"
	:height="450"
	:with-ok-button="true"
	:ok-button-disabled="false"
	@ok="ok()"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
>
	<template #header>{{ $t('notificationSetting') }}</template>
	<div v-if="showGlobalToggle" class="_section">
		<MkSwitch v-model:value="useGlobalSetting">
			{{ $t('useGlobalSetting') }}
			<template #desc>{{ $t('useGlobalSettingDesc') }}</template>
		</MkSwitch>
	</div>
	<div v-if="!useGlobalSetting" class="_section">
		<MkInfo>{{ $t('notificationSettingDesc') }}</MkInfo>
		<MkButton inline @click="disableAll">{{ $t('disableAll') }}</MkButton>
		<MkButton inline @click="enableAll">{{ $t('enableAll') }}</MkButton>
		<MkSwitch v-for="type in notificationTypes" :key="type" v-model:value="typesMap[type]">{{ $t(`_notification._types.${type}`) }}</MkSwitch>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import MkSwitch from './ui/switch.vue';
import MkInfo from './ui/info.vue';
import MkButton from './ui/button.vue';
import { notificationTypes } from '../../types';

export default defineComponent({
	components: {
		XModalWindow,
		MkSwitch,
		MkInfo,
		MkButton
	},

	props: {
		includingTypes: {
			// TODO: これで型に合わないものを弾いてくれるのかどうか要調査
			type: Array as PropType<typeof notificationTypes[number][]>,
			required: false,
			default: null,
		},
		showGlobalToggle: {
			type: Boolean,
			required: false,
			default: true,
		}
	},

	emits: ['done', 'closed'],

	data() {
		return {
			typesMap: {} as Record<typeof notificationTypes[number], boolean>,
			useGlobalSetting: false,
			notificationTypes,
		};
	},

	created() {
		this.useGlobalSetting = this.includingTypes === null && this.showGlobalToggle;

		for (const type of this.notificationTypes) {
			this.typesMap[type] = this.includingTypes === null || this.includingTypes.includes(type);
		}
	},

	methods: {
		ok() {
			const includingTypes = this.useGlobalSetting ? null : (Object.keys(this.typesMap) as typeof notificationTypes[number][])
				.filter(type => this.typesMap[type]);

			this.$emit('done', { includingTypes });
		},

		disableAll() {
			for (const type in this.typesMap) {
				this.typesMap[type as typeof notificationTypes[number]] = false;
			}
		},

		enableAll() {
			for (const type in this.typesMap) {
				this.typesMap[type as typeof notificationTypes[number]] = true;
			}
		}
	}
});
</script>
