<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="900">
			<div class="ogwlenmc">
				<div v-if="tab === 'local'" class="local">
                    <MkInput v-model="query" :debounce="true" type="search" autocapitalize="off">
                        <template #prefix><i class="ti ti-search"></i></template>
                        <template #label>{{ i18n.ts.search }}</template>
                    </MkInput>
                    <MkSwitch v-model="selectMode" style="margin: 8px 0;">
                        <template #label>Select mode</template>
                    </MkSwitch>
                    <div v-if="selectMode" class="_buttons">
                        <MkButton inline @click="selectAll">Select all</MkButton>
                        <MkButton inline @click="setCategoryBulk">Set category</MkButton>
                        <MkButton inline @click="setTagBulk">Set tag</MkButton>
                        <MkButton inline @click="addTagBulk">Add tag</MkButton>
                        <MkButton inline @click="removeTagBulk">Remove tag</MkButton>
                        <MkButton inline @click="setLicenseBulk">Set License</MkButton>
                        <MkButton inline danger @click="delBulk">Delete</MkButton>
                    </div>
                    <MkPagination ref="emojisPaginationComponent" :pagination="pagination">
                        <template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
                        <template #default="{items}">
                            <div class="ldhfsamy">
                                <button v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" :class="{ selected: selectedEmojis.includes(emoji.id) }" @click="selectMode ? toggleSelect(emoji) : edit(emoji)">
                                    <img :src="`/emoji/${emoji.name}.webp`" class="img" :alt="emoji.name"/>
                                    <div class="body">
                                        <div class="name _monospace">{{ emoji.name }}</div>
                                        <div class="info">{{ emoji.category }}</div>
                                    </div>
                                </button>
                            </div>
                        </template>
                    </MkPagination>
				</div>
				<div v-if="tab === 'draft'" class="draft">
					<MkCustomEmojiEditDraft/>
				</div>
				<div v-else-if="tab === 'remote'" class="remote">
                    <FormSplit>
                        <MkInput v-model="queryRemote" :debounce="true" type="search" autocapitalize="off">
                            <template #prefix><i class="ti ti-search"></i></template>
                            <template #label>{{ i18n.ts.search }}</template>
                        </MkInput>
                        <MkInput v-model="host" :debounce="true">
                            <template #label>{{ i18n.ts.host }}</template>
                        </MkInput>
                    </FormSplit>
                    <MkPagination :pagination="remotePagination">
                        <template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
                        <template #default="{items}">
                            <div class="ldhfsamy">
                                <div v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" @click="remoteMenu(emoji, $event)">
                                    <img :src="`/emoji/${emoji.name}@${emoji.host}.webp`" class="img" :alt="emoji.name"/>
                                    <div class="body">
                                        <div class="name _monospace">{{ emoji.name }}</div>
                                        <div class="info">{{ emoji.host }}</div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </MkPagination>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import MkCustomEmojiEditDraft from '@/components/MkCustomEmojiEditDraft.vue';
import MkCustomEmojiEditLocal from '@/components/MkCustomEmojiEditLocal.vue';
import MkCustomEmojiEditRemote from '@/components/MkCustomEmojiEditRemote.vue';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const tab = ref('draft');

const add = async (ev: MouseEvent) => {
	os.popup(defineAsyncComponent(() => import('@/components/MkEmojiEditDialog.vue')), {
	}, {
		done: result => {
			//TODO: emitにして追加を反映
			// if (result.created) {
			// 	emojisPaginationComponent.value.prepend(result.created);
			// 	emojisPaginationComponent.value.reload();
			// }
		},
	}, 'closed');
};

const menu = (ev: MouseEvent) => {
	os.popupMenu([{
		icon: 'ti ti-download',
		text: i18n.ts.export,
		action: async () => {
			os.api('export-custom-emojis', {
			})
				.then(() => {
					os.alert({
						type: 'info',
						text: i18n.ts.exportRequested,
					});
				}).catch((err) => {
					os.alert({
						type: 'error',
						text: err.message,
					});
				});
		},
	}, {
		icon: 'ti ti-upload',
		text: i18n.ts.import,
		action: async () => {
			const file = await selectFile(ev.currentTarget ?? ev.target);
			os.api('admin/emoji/import-zip', {
				fileId: file.id,
			})
				.then(() => {
					os.alert({
						type: 'info',
						text: i18n.ts.importRequested,
					});
				}).catch((err) => {
					os.alert({
						type: 'error',
						text: err.message,
					});
				});
		},
	}], ev.currentTarget ?? ev.target);
};

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.addEmoji,
	handler: add,
}, {
	icon: 'ti ti-dots',
	handler: menu,
}]);

const headerTabs = $computed(() => [{
	key: 'draft',
	title: i18n.ts.draftEmojis,
}, {
	key: 'local',
	title: i18n.ts.local,
}, {
	key: 'remote',
	title: i18n.ts.remote,
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
})));
</script>

<style lang="scss" scoped>
</style>
