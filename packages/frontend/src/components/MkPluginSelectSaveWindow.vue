<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:withOkButton="true"
	:okButtonDisabled="false"
	:canClose="false"
	@close="dialog.close()"
	@closed="$emit('closed')"
	@ok="ok()"
>
	<template #header>{{ i18n.ts.pluginSyncSettings }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<div class="_gaps_m">
			<div>
				<MkInfo>{{ i18n.ts.pluginSyncSettingsInfo }}</MkInfo>
			</div>
			<div v-if="isExistsFromAccount && localOrAccount === 'account'">
				<MkInfo warn>{{ i18n.ts.duplicateSyncedPlugin }}</MkInfo>
				<MkSwitch v-model="pluginOnlyOverride" :class="$style.switch">{{ i18n.ts.overrideSourceCodeOnly }}</MkSwitch>
			</div>
			<div>
				<MkSelect v-model="localOrAccount">
					<template #label>{{ i18n.ts.syncSetting }}</template>
					<option value="local">{{ i18n.ts.localOnly }}</option>
					<option value="account">{{ i18n.ts.syncing }}</option>
				</MkSelect>
			</div>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkSwitch from './MkSwitch.vue';
import MkSelect from './MkSelect.vue';
import MkInfo from './MkInfo.vue';
import MkModalWindow from './MkModalWindow.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	isExistsFromAccount: boolean;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'done', result: { name: string | null, permissions: string[] }): void;
}>();

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();
let localOrAccount = $ref(props.isExistsFromAccount ? 'account' : 'local');
let pluginOnlyOverride = $ref(false);

function ok(): void {
	emit('done', {
		isLocal: localOrAccount === 'local',
		pluginOnlyOverride,
	});
	dialog.close();
}
</script>

<style lang="scss" module>
	.switch {
		margin-top: 10px;
	}
</style>
