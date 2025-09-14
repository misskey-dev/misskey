<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 600px;">
		<div class="_gaps_m">
			<MkResult v-if="resultType === 'empty'" type="empty"/>
			<MkResult v-if="resultType === 'notFound'" type="notFound"/>
			<MkResult v-if="resultType === 'error'" type="error"/>
			<MkSelect
				v-model="resultType" :items="resultTypeDef"
			></MkSelect>

			<MkSystemIcon v-if="iconType === 'info'" type="info" style="width: 150px;"/>
			<MkSystemIcon v-if="iconType === 'question'" type="question" style="width: 150px;"/>
			<MkSystemIcon v-if="iconType === 'success'" type="success" style="width: 150px;"/>
			<MkSystemIcon v-if="iconType === 'warn'" type="warn" style="width: 150px;"/>
			<MkSystemIcon v-if="iconType === 'error'" type="error" style="width: 150px;"/>
			<MkSystemIcon v-if="iconType === 'waiting'" type="waiting" style="width: 150px;"/>
			<MkSelect
				v-model="iconType" :items="iconTypeDef"
			></MkSelect>

			<div class="_buttons">
				<MkButton @click="os.alert({ type: 'error', title: 'Error', text: 'error' })">Error</MkButton>
				<MkButton @click="os.alert({ type: 'warning', title: 'Warning', text: 'warning' })">Warning</MkButton>
				<MkButton @click="os.alert({ type: 'info', title: 'Info', text: 'info' })">Info</MkButton>
				<MkButton @click="os.alert({ type: 'success', title: 'Success', text: 'success' })">Success</MkButton>
				<MkButton @click="os.alert({ type: 'question', title: 'Question', text: 'question' })">Question</MkButton>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { definePage } from '@/page.js';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkLink from '@/components/MkLink.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { useMkSelect } from '@/composables/use-mkselect.js';
import * as os from '@/os.js';

const {
	model: resultType,
	def: resultTypeDef,
} = useMkSelect({
	items: [
		{ label: 'empty', value: 'empty' },
		{ label: 'notFound', value: 'notFound' },
		{ label: 'error', value: 'error' },
	],
	initialValue: 'empty',
});
const {
	model: iconType,
	def: iconTypeDef,
} = useMkSelect({
	items: [
		{ label: 'info', value: 'info' },
		{ label: 'question', value: 'question' },
		{ label: 'success', value: 'success' },
		{ label: 'warn', value: 'warn' },
		{ label: 'error', value: 'error' },
		{ label: 'waiting', value: 'waiting' },
	],
	initialValue: 'info',
});

definePage(() => ({
	title: 'DEBUG ROOM',
	icon: 'ti ti-help-circle',
}));
</script>
