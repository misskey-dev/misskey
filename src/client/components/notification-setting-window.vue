<template>
<XWindow :width="400" :height="450" :no-padding="true" @close="$emit('done')" :with-ok-button="true" :ok-button-disabled="false" @ok="ok()">
	<template #header>{{ $t('notificationSetting') }}</template>
	<div class="vv94n3oa">
		<div v-if="showGlobalToggle">
			<MkSwitch v-model:value="useGlobalSetting">
				{{ $t('useGlobalSetting') }}
				<template #desc>{{ $t('useGlobalSettingDesc') }}</template>
			</MkSwitch>
		</div>
		<div v-if="!useGlobalSetting">
			<MkInfo>{{ $t('notificationSettingDesc') }}</MkInfo>
			<MkButton inline @click="disableAll">{{ $t('disableAll') }}</MkButton>
			<MkButton inline @click="enableAll">{{ $t('enableAll') }}</MkButton>
			<MkSwitch v-for="type in notificationTypes" :key="type" v-model:value="typesMap[type]">{{ $t(`_notification._types.${type}`) }}</MkSwitch>
		</div>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import XWindow from './window.vue';
import MkSwitch from './ui/switch.vue';
import MkInfo from './ui/info.vue';
import MkButton from './ui/button.vue';
import { notificationTypes } from '../../types';
import * as os from '@/os';

export default defineComponent({
	components: {
		XWindow,
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

	emits: ['done'],

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

<style lang="scss" scoped>
.vv94n3oa {
	> div {
		border-top: solid 1px var(--divider);
		padding: 24px;
	}
}
</style>
