<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow v-if="page === 1" ref="uiWindow" :initialWidth="400" :initialHeight="500" :canResize="true" @closed="emit('closed')">
	<template #header>
		<i class="ti ti-exclamation-circle" style="margin-right: 0.5em;"></i>
		<I18n :src="i18n.ts.reportAbuseOf" tag="span">
			<template #name>
				<b><MkAcct :user="user"/></b>
			</template>
		</I18n>
	</template>
	<MkSpacer :marginMin="20" :marginMax="28">
		<div class="_gaps_m" :class="$style.root">
			<div>
				<MkSelect v-model="category" :required="true">
					<template #label>{{ i18n.ts.abuseReportCategory }}</template>
					<option value="" selected disabled>{{ i18n.ts.selectCategory }}</option>
					<option value="nsfw">{{ i18n.ts._abuseReportCategory.nsfw }}</option>
					<option value="spam">{{ i18n.ts._abuseReportCategory.spam }}</option>
					<option value="explicit">{{ i18n.ts._abuseReportCategory.explicit }}</option>
					<option value="phishing">{{ i18n.ts._abuseReportCategory.phishing }}</option>
					<option value="personalinfoleak">{{ i18n.ts._abuseReportCategory.personalinfoleak }}</option>
					<option value="selfharm">{{ i18n.ts._abuseReportCategory.selfharm }}</option>
					<option value="criticalbreach">{{ i18n.ts._abuseReportCategory.criticalbreach }}</option>
					<option value="otherbreach">{{ i18n.ts._abuseReportCategory.otherbreach }}</option>
					<option value="violationrights">{{ i18n.ts._abuseReportCategory.violationrights }}</option>
					<option value="violationrightsother">{{ i18n.ts._abuseReportCategory.violationrightsother }}</option>
					<option value="notlike">{{ i18n.ts._abuseReportCategory.notlike }}</option>
					<option value="other">{{ i18n.ts._abuseReportCategory.other }}</option>
				</MkSelect>
			</div>
			<div class="">
				<MkTextarea v-model="comment">
					<template #label>{{ i18n.ts.details }}</template>
					<template #caption>{{ i18n.ts.fillAbuseReportDescription }}</template>
				</MkTextarea>
			</div>
			<div class="">
				<MkButton primary full :disabled="comment.length === 0 || category.length === 0" @click="send">{{ i18n.ts.send }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkWindow>

<MkWindow v-if="page === 2" ref="uiWindow2" :initialWidth="450" :initialHeight="250" :canResize="true" @closed="emit('closed')">
	<template #header>
		<i class="ti ti-circle-check" style="margin-right: 0.5em;"></i>
		<span><MkAcct :user="props.user"/> {{ i18n.ts.reportComplete }}</span>
	</template>
	<MkSpacer :marginMin="20" :marginMax="28">
		<div class="_gaps_m" :class="$style.root">
			<div>
				<p style="margin-bottom: 20px;">{{ i18n.ts.abuseReported }}</p>
				<MkButton :disabled="fullUserInfo?.isBlocking" @click="blockUser">{{ i18n.ts.blockThisUser }}</MkButton>
				<br>
				<MkButton :disabled="fullUserInfo?.isMuted" @click="muteUser">{{ i18n.ts.muteThisUser }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkWindow>
</template>

<script setup lang="ts">
import { ref, shallowRef, Ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkWindow from '@/components/MkWindow.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	user: Misskey.entities.User;
	initialComment?: string;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const uiWindow = shallowRef<InstanceType<typeof MkWindow>>();
const uiWindow2 = shallowRef<InstanceType<typeof MkWindow>>();
const comment = ref(props.initialComment ?? '');
const category = ref('');
const page = ref(1);
const fullUserInfo: Ref<Misskey.entities.UserDetailed | null> = ref(null);

function blockUser() {
	os.confirm({
		type: 'warning',
		title: i18n.ts.block,
		text: i18n.ts.blockConfirm,
	}).then((v) => {
		if (v.canceled) return;
		os.apiWithDialog('blocking/create', { userId: props.user.id }).then(refreshUserInfo);
	});
}

function muteUser() {
	os.apiWithDialog('mute/create', { userId: props.user.id }).then(refreshUserInfo);
}

function refreshUserInfo() {
	os.api('users/show', { userId: props.user.id })
	.then((res) => {
		fullUserInfo.value = res;
	});
}

function send() {
	if (category.value === 'violationrightsother') {
		os.alert({
			type: 'info',
			text: i18n.ts._abuseReportMsgs.rightsAbuseCantAccept
		});
		uiWindow.value?.close();
		emit('closed');
		return;
	}
	if (category.value === 'notlike') {
		uiWindow.value?.close();
		page.value = 2;
	}
	os.apiWithDialog('users/report-abuse', {
		userId: props.user.id,
		comment: comment.value,
		category: category.value,
	}, undefined).then(res => {
		os.api('users/show', { userId: props.user.id })
		.then((res) => {
			fullUserInfo.value = res;
			uiWindow.value?.close();
			page.value = 2;
		});
	});
}
</script>

<style lang="scss" module>
.root {
	--root-margin: 16px;
}
</style>
