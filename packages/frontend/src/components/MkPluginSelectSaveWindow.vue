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
	<template #header>{{ 'プラグインの共有設定' }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<div class="_gaps_m">
			<div>
				<MkInfo>{{ 'このプラグインをローカルのみにインストールするか他端末と同期するかを選択できます。' }}</MkInfo>
			</div>
			<div v-if="isExistsFromAccount && localOrAccount === 'account'">
				<MkInfo warn>{{ 'このプラグインは同期されているプラグインと重複しています。' }}</MkInfo>
				<MkSwitch v-model="pluginOnlyOverride" :class="$style.switch">{{ 'コードのみを上書きする' }}</MkSwitch>
			</div>
			<div>
				<MkSelect v-model="localOrAccount">
					<template #label>{{ '共有設定' }}</template>
					<option value="local">{{ 'ローカルのみ' }}</option>
					<option value="account">{{ '他端末で同期' }}</option>
				</MkSelect>
			</div>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
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
