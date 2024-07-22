<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:initialWidth="600"
	:initialHeight="600"
	:canResize="true"
	@close="windowEl.close()"
	@closed="$emit('closed')"
>
	<template v-if="emoji" #header>:{{ emoji.name }}:</template>
	<template v-else-if="isRequest && !emoji" #header>{{ i18n.ts.requestCustomEmojis }}</template>
	<template v-else #header>New emoji</template>

	<div>
		<MkSpacer :marginMin="20" :marginMax="28">
			<div class="_gaps_m" style="display: flex; flex-direction: row">
				<div>
					<div v-if="imgUrl != null" :class="$style.imgs">
						<div style="background: #000;" :class="$style.imgContainer">
							<img :src="imgUrl" :class="$style.img"/>
						</div>
						<div style="background: #222;" :class="$style.imgContainer">
							<img :src="imgUrl" :class="$style.img"/>
						</div>
						<div style="background: #ddd;" :class="$style.imgContainer">
							<img :src="imgUrl" :class="$style.img"/>
						</div>
						<div style="background: #fff;" :class="$style.imgContainer">
							<img :src="imgUrl" :class="$style.img"/>
						</div>
					</div>
					<MkButton rounded style="margin: 0 auto;" @click="changeImage">{{ i18n.ts.selectFile }}</MkButton>
					<MkInput v-model="name" pattern="[a-z0-9_]" autocapitalize="off">
						<template #label>{{ i18n.ts.name }}</template>
						<template #caption>{{ i18n.ts.emojiNameValidation }}</template>
					</MkInput>
					<MkInput v-model="category" :datalist="customEmojiCategories">
						<template #label>{{ i18n.ts.category }}</template>
					</MkInput>
					<MkInput v-model="aliases" autocapitalize="off">
						<template #label>{{ i18n.ts.tags }}</template>
						<template #caption>
							{{ i18n.ts.theKeywordWhenSearchingForCustomEmoji }}<br/>
							{{ i18n.ts.setMultipleBySeparatingWithSpace }}
						</template>
					</MkInput>
					<MkInput v-model="license" :mfmAutocomplete="true">
						<template #label>{{ i18n.ts.license }}</template>
					</MkInput>
					<MkFolder v-if="!isRequest">
						<template #label>{{ i18n.ts.rolesThatCanBeUsedThisEmojiAsReaction }}</template>
						<template #suffix>{{ rolesThatCanBeUsedThisEmojiAsReaction.length === 0 ? i18n.ts.all : rolesThatCanBeUsedThisEmojiAsReaction.length }}</template>

						<div class="_gaps">
							<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

							<div v-for="role in rolesThatCanBeUsedThisEmojiAsReaction" :key="role.id" :class="$style.roleItem">
								<MkRolePreview :class="$style.role" :role="role" :forModeration="true" :detailed="false" style="pointer-events: none;"/>
								<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnassign" @click="removeRole(role, $event)"><i class="ti ti-x"></i></button>
								<button v-else class="_button" :class="$style.roleUnassign" disabled><i class="ti ti-ban"></i></button>
							</div>

							<MkInfo>{{ i18n.ts.rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription }}</MkInfo>
							<MkInfo warn>{{ i18n.ts.rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn }}</MkInfo>
						</div>
					</MkFolder>
					<MkSwitch v-model="isSensitive">{{ i18n.ts.isSensitive }}</MkSwitch>
					<MkSwitch v-model="localOnly">{{ i18n.ts.localOnly }}</MkSwitch>
					<MkSwitch v-model="isNotifyIsHome">
						{{ i18n.ts.isNotifyIsHome }}
					</MkSwitch>
				</div>
				<div v-if="imgUrl" style="width: 30%">
					<MkInput v-model="text">
						<template #label>テスト文章</template>
					</MkInput><br/>
					<MkNoteSimple :emojireq="true" :note="{isHidden:false,replyId:null,renoteId:null,files:[],user: $i,text:text,cw:null, emojis: {[name]: imgUrl}}"/>
					<p v-if="speed ">基準より眩しい可能性があります。</p>
					<p v-if="!speed">問題は見つかりませんでした。</p>
					<p>※上記の物は問題がないことを保証するものではありません。</p>
				</div>
			</div>
		</MkSpacer>

		<div :class="$style.footer">
			<div :class="$style.footerButtons">
				<MkButton v-if="!isRequest" danger rounded style="margin: 0 auto;" @click="del()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
				<MkButton v-if="validation" primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.emoji ? i18n.ts.update : i18n.ts.create }}</MkButton>
				<MkButton v-else rounded style="margin: 0 auto;"><i class="ti ti-check"></i> {{ props.emoji ? i18n.ts.update : i18n.ts.create }}</MkButton>
			</div>
		</div>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkWindow from '@/components/MkWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { customEmojiCategories } from '@/custom-emojis.js';
import MkSwitch from '@/components/MkSwitch.vue';
import { selectFile, selectFiles } from '@/scripts/select-file.js';
import MkRolePreview from '@/components/MkRolePreview.vue';
import { $i } from '@/account.js';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
const props = defineProps<{
  emoji?: any,
  isRequest: boolean,
}>();
const text = ref<string>('テスト文章');
const speed = ref<boolean>(false);
const windowEl = ref<InstanceType<typeof MkWindow> | null>(null);
const name = ref<string>(props.emoji ? props.emoji.name : '');
const category = ref<string>(props.emoji ? props.emoji.category : '');
const aliases = ref<string>(props.emoji ? props.emoji.aliases.join(' ') : '');
const license = ref<string>(props.emoji ? (props.emoji.license ?? '') : '');
const isSensitive = ref(props.emoji ? props.emoji.isSensitive : false);
const localOnly = ref(props.emoji ? props.emoji.localOnly : false);
const roleIdsThatCanBeUsedThisEmojiAsReaction = ref(props.emoji ? props.emoji.roleIdsThatCanBeUsedThisEmojiAsReaction : []);
const rolesThatCanBeUsedThisEmojiAsReaction = ref<Misskey.entities.Role[]>([]);
const file = ref<Misskey.entities.DriveFile>();
let isRequest = ref(props.isRequest ?? false);
watch(roleIdsThatCanBeUsedThisEmojiAsReaction, async () => {
	rolesThatCanBeUsedThisEmojiAsReaction.value = (await Promise.all(roleIdsThatCanBeUsedThisEmojiAsReaction.value.map((id) => misskeyApi('admin/roles/show', { roleId: id }).catch(() => null)))).filter(x => x != null);
}, { immediate: true });
const isNotifyIsHome = ref(props.emoji ? props.emoji.isNotifyIsHome : false);
const imgUrl = computed(() => file.value ? file.value.url : props.emoji && !isRequest.value ? `/emoji/${props.emoji.name}.webp` : props.emoji && props.emoji.url ? props.emoji.url : null);
const validation = computed(() => {
	return name.value.match(/^[a-zA-Z0-9_]+$/) && imgUrl.value != null;
});
const emit = defineEmits<{
  (ev: 'done', v: { deleted?: boolean; updated?: any; created?: any }): void,
  (ev: 'closed'): void
}>();

const colorChanges = ref<number | null>(null);

watch(colorChanges, (value) => {
	console.log(value);
});

async function changeImage(ev) {
	file.value = await selectFile(ev.currentTarget ?? ev.target, null);
	const candidate = file.value.name.replace(/\.(.+)$/, '');
	if (candidate.match(/^[a-z0-9_]+$/)) {
		name.value = candidate;
	}
}

async function addRole() {
	const roles = await misskeyApi('admin/roles/list');
	const currentRoleIds = rolesThatCanBeUsedThisEmojiAsReaction.value.map(x => x.id);

	const { canceled, result: role } = await os.select({
		items: roles.filter(r => r.isPublic).filter(r => !currentRoleIds.includes(r.id)).map(r => ({ text: r.name, value: r })),
	});
	if (canceled || role == null) return;

	rolesThatCanBeUsedThisEmojiAsReaction.value.push(role);
}

async function removeRole(role, ev) {
	rolesThatCanBeUsedThisEmojiAsReaction.value = rolesThatCanBeUsedThisEmojiAsReaction.value.filter(x => x.id !== role.id);
}

async function done() {
	const params = {
		name: name.value,
		category: category.value === '' ? null : category.value,
		aliases: aliases.value.replace('　', ' ').split(' ').filter(x => x !== ''),
		license: license.value === '' ? null : license.value,
		Request: isRequest.value,
		isSensitive: isSensitive.value,
		localOnly: localOnly.value,
		roleIdsThatCanBeUsedThisEmojiAsReaction: rolesThatCanBeUsedThisEmojiAsReaction.value.map(x => x.id),
		isNotifyIsHome: isNotifyIsHome.value,
	};

	if (file.value) {
		params.fileId = file.value.id;
	}
	if (props.emoji) {
		if (isRequest.value) {
			await os.apiWithDialog('admin/emoji/update-request', {
				id: props.emoji.id,
				...params,
			});
		} else {
			await os.apiWithDialog('admin/emoji/update', {
				id: props.emoji.id,
				...params,
			});
		}

		emit('done', {
			updated: {
				id: props.emoji.id,
				...params,
			},
		});

		windowEl.value.close();
	} else {
		const created = isRequest.value
			? await os.apiWithDialog('admin/emoji/add-request', params)
			: await os.apiWithDialog('admin/emoji/add', params);

		emit('done', {
			created: created,
		});

		windowEl.value.close();
	}
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.removeAreYouSure({ x: name }),
	});
	if (canceled) return;

	misskeyApi('admin/emoji/delete', {
		id: props.emoji.id,
	}).then(() => {
		emit('done', {
			deleted: true,
		});
		windowEl.value.close();
	});
}

watch(imgUrl, async (value) => {
	 speed.value = await misskeyApi('emoji/speedtest', {
		url: value,
	});
});
</script>

<style lang="scss" module>
.imgs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.imgContainer {
  padding: 8px;
  border-radius: var(--radius);
}

.img {
  display: block;
  height: 64px;
  width: 64px;
  object-fit: contain;
}
.preview {
  display: block;
  height: 16px;

  object-fit: contain;
}

.roleItem {
  display: flex;
}

.role {
  flex: 1;
}

.roleUnassign {
  width: 32px;
  height: 32px;
  margin-left: 8px;
  align-self: center;
}

.footer {
  position: sticky;
  bottom: 0;
  left: 0;
  padding: 12px;
  border-top: solid 0.5px var(--divider);
  -webkit-backdrop-filter: var(--blur, blur(15px));
  backdrop-filter: var(--blur, blur(15px));
}

.footerButtons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
