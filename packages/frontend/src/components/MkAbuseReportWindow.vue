<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow v-if="page === 1" ref="uiWindow" :initialWidth="500" :initialHeight="500" :canResize="true" @closed="emit('closed')">
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
			<MkSelect v-model="category" :required="true">
				<template #label>{{ i18n.ts.abuseReportCategory }}</template>
				<template v-if="category" #caption><Mfm :text="i18n.ts._abuseReportCategory[`${category}_description`]"/></template>
				<option value="" selected disabled>{{ i18n.ts.selectCategory }}</option>
				<option value="nsfw">{{ i18n.ts._abuseReportCategory.nsfw }}</option>
				<option value="spam">{{ i18n.ts._abuseReportCategory.spam }}</option>
				<option value="explicit">{{ i18n.ts._abuseReportCategory.explicit }}</option>
				<option value="phishing">{{ i18n.ts._abuseReportCategory.phishing }}</option>
				<option value="personalInfoLeak">{{ i18n.ts._abuseReportCategory.personalInfoLeak }}</option>
				<option value="selfHarm">{{ i18n.ts._abuseReportCategory.selfHarm }}</option>
				<option value="criticalBreach">{{ i18n.ts._abuseReportCategory.criticalBreach }}</option>
				<option value="otherBreach">{{ i18n.ts._abuseReportCategory.otherBreach }}</option>
				<option value="violationRights">{{ i18n.ts._abuseReportCategory.violationRights }}</option>
				<option value="violationRightsOther">{{ i18n.ts._abuseReportCategory.violationRightsOther }}</option>
				<option value="notLike">{{ i18n.ts._abuseReportCategory.notLike }}</option>
				<option value="other">{{ i18n.ts._abuseReportCategory.other }}</option>
			</MkSelect>
			<MkTextarea v-model="comment">
				<template #label>{{ i18n.ts.details }}</template>
				<template #caption>{{ i18n.ts.fillAbuseReportDescription }}</template>
			</MkTextarea>
			<MkButton primary full :disabled="comment.length === 0 || category.length === 0" @click="send">{{ i18n.ts.send }}</MkButton>
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
import MkSelect from '@/components/MkSelect.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
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
	misskeyApi('users/show', { userId: props.user.id })
		.then((res) => {
			fullUserInfo.value = res;
		});
}

function send() {
	if (category.value === 'notLike') {
		uiWindow.value?.close();
		page.value = 2;
		return;
	}
	os.apiWithDialog('users/report-abuse', {
		userId: props.user.id,
		comment: comment.value,
		category: category.value,
	}, undefined).then(res => {
		misskeyApi('users/show', { userId: props.user.id })
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
