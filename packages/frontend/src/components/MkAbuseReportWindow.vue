<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow ref="uiWindow" :initialWidth="400" :initialHeight="500" :canResize="true" style="overflow-x: clip;" @closed="emit('closed')">
	<template #header>
		<i class="ti ti-exclamation-circle" style="margin-right: 0.5em;"></i>
		<I18n :src="i18n.ts.reportAbuseOf" tag="span">
			<template #name>
				<b><MkAcct :user="user"/></b>
			</template>
		</I18n>
	</template>
	<Transition
		mode="out-in"
		:enterActiveClass="$style.transition_x_enterActive"
		:leaveActiveClass="$style.transition_x_leaveActive"
		:enterFromClass="$style.transition_x_enterFrom"
		:leaveToClass="$style.transition_x_leaveTo"
	>
		<template v-if="page === 0">
			<MkSpacer :marginMin="20" :marginMax="28">
				<div class="_gaps_m" :class="$style.root">
					<MkPagination v-slot="{items}" :key="user.id" :pagination="Pagination">
						<div v-for="item in items" :key="item.id" :class="$style.note">
							<MkSwitch :modelValue="item.id === initialNoteId" @update:modelValue="pushAbuseReportNote($event,item.id)"></MkSwitch>
							<MkAvatar :user="item.user" preview/>
							<MkNoteSimple :note="item"/>
						</div>
					</MkPagination>
					<div class="_buttonsCenter">
						<MkButton primary rounded gradate @click="page++">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
					</div>
				</div>
			</MkSpacer>
		</template>

		<template v-else-if="page === 1">
			<MkSpacer :marginMin="20" :marginMax="28">
				<div class="_gaps_m" :class="$style.root">
					<MkTextarea v-model="comment">
						<template #label>{{ i18n.ts.details }}</template>
						<template #caption>{{ i18n.ts.fillAbuseReportDescription }}</template>
					</MkTextarea>
					<div class="_buttonsCenter">
						<MkButton @click="page--"><i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}</MkButton>
						<MkButton primary :disabled="comment.length === 0" @click="send">{{ i18n.ts.send }}</MkButton>
					</div>
				</div>
			</MkSpacer>
		</template>
	</Transition>
</MkWindow>
</template>

<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkWindow from '@/components/MkWindow.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import MkPagination from '@/components/MkPagination.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkSwitch from '@/components/MkSwitch.vue';

const props = defineProps<{
	user: Misskey.entities.User;
	initialComment?: string;
  initialNoteId?: Misskey.entities.Note['id'];
}>();

const Pagination = {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: {
		userId: props.user.id,
	},
};

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const abuseNotesId = ref(props.initialNoteId ? [props.initialNoteId] : []);
const page = ref(0);
const uiWindow = shallowRef<InstanceType<typeof MkWindow>>();
const comment = ref(props.initialComment ?? '');

function pushAbuseReportNote(v, id) {
	if (v) {
		abuseNotesId.value.push(id);
	} else {
		abuseNotesId.value = abuseNotesId.value.filter(noteId => noteId !== id);
	}
}

function send() {
	os.apiWithDialog('users/report-abuse', {
		userId: props.user.id,
		comment: comment.value,
		noteIds: abuseNotesId.value,
	}, undefined).then(res => {
		os.alert({
			type: 'success',
			text: i18n.ts.abuseReported,
		});
		uiWindow.value?.close();
		emit('closed');
	});
}
</script>

<style lang="scss" module>
.root {
	--root-margin: 16px;
}
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}
.note{
  display: flex;
  margin: var(--margin) 0;
  align-items: center;

}
</style>
