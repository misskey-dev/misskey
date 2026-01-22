<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 900px;">
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
				<MkPagination ref="emojisPaginationComponent" :paginator="paginator">
					<template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
					<template #default="{items}">
						<div class="ldhfsamy">
							<button v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" :class="{ selected: selectedEmojis.includes(emoji.id) }" @click="selectMode ? toggleSelect(emoji) : edit(emoji)">
								<img :src="emoji.url" class="img" :alt="emoji.name"/>
								<div class="body">
									<div class="name _monospace">{{ emoji.name }}</div>
									<div class="info">{{ emoji.category }}</div>
								</div>
							</button>
						</div>
					</template>
				</MkPagination>
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
				<MkPagination :paginator="remotePaginator">
					<template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
					<template #default="{items}">
						<div class="ldhfsamy">
							<div v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" @click="remoteMenu(emoji as RemoteEmoji, $event)">
								<img :src="getProxiedImageUrl(emoji.url, 'emoji')" class="img" :alt="emoji.name"/>
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
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { computed, markRaw, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkRemoteEmojiEditDialog from '@/components/MkRemoteEmojiEditDialog.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSplit from '@/components/form/split.vue';
import { selectFile } from '@/utility/drive.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { getProxiedImageUrl } from '@/utility/media-proxy.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { Paginator } from '@/utility/paginator.js';

const tab = ref('local');
const query = ref<string | null>(null);
const queryRemote = ref<string | null>(null);
const host = ref<string | null>(null);
const selectMode = ref(false);
const selectedEmojis = ref<string[]>([]);

type RemoteEmoji = Misskey.entities.AdminEmojiListRemoteResponse[number] & { host: string };

const paginator = markRaw(new Paginator('admin/emoji/list', {
	limit: 30,
	computedParams: computed(() => ({
		query: (query.value && query.value !== '') ? query.value : null,
	})),
}));

const remotePaginator = markRaw(new Paginator('admin/emoji/list-remote', {
	limit: 30,
	computedParams: computed(() => ({
		query: (queryRemote.value && queryRemote.value !== '') ? queryRemote.value : null,
		host: (host.value && host.value !== '') ? host.value : null,
	})),
}));

const selectAll = () => {
	if (selectedEmojis.value.length > 0) {
		selectedEmojis.value = [];
	} else {
		selectedEmojis.value = paginator.items.value.map(item => item.id);
	}
};

const toggleSelect = (emoji: Misskey.entities.EmojiDetailed) => {
	if (selectedEmojis.value.includes(emoji.id)) {
		selectedEmojis.value = selectedEmojis.value.filter(x => x !== emoji.id);
	} else {
		selectedEmojis.value.push(emoji.id);
	}
};

const add = async () => {
	const { dispose } = await os.popupAsyncWithDialog(import('./emoji-edit-dialog.vue').then(x => x.default), {
	}, {
		done: result => {
			if (result.created) {
				const nowIso = (new Date()).toISOString();
				paginator.prepend({
					...result.created,
					createdAt: nowIso,
				});
			}
		},
		closed: () => dispose(),
	});
};

const edit = async (emoji: Misskey.entities.EmojiDetailed) => {
	const { dispose } = await os.popupAsyncWithDialog(import('./emoji-edit-dialog.vue').then(x => x.default), {
		emoji: emoji,
	}, {
		done: result => {
			if (result.updated) {
				paginator.updateItem(result.updated.id, (oldEmoji) => ({
					...oldEmoji,
					...result.updated,
				}));
			} else if (result.deleted) {
				paginator.removeItem(emoji.id);
			}
		},
		closed: () => dispose(),
	});
};

const detailRemoteEmoji = (emoji: {
	id: string,
	name: string,
	host: string,
	license: string | null,
	url: string
}) => {
	const { dispose } = os.popup(MkRemoteEmojiEditDialog, {
		emoji: emoji,
	}, {
		done: () => {
			dispose();
		},
		closed: () => {
			dispose();
		},
	});
};

const importEmoji = (emojiId: string) => {
	os.apiWithDialog('admin/emoji/copy', {
		emojiId: emojiId,
	});
};

const remoteMenu = (emoji: {
	id: string,
	name: string,
	host: string,
	license: string | null,
	url: string
}, ev: PointerEvent) => {
	os.popupMenu([{
		type: 'label',
		text: ':' + emoji.name + ':',
	}, {
		text: i18n.ts.details,
		icon: 'ti ti-info-circle',
		action: () => { detailRemoteEmoji(emoji); },
	}, {
		text: i18n.ts.import,
		icon: 'ti ti-plus',
		action: () => { importEmoji(emoji.id); },
	}], ev.currentTarget ?? ev.target);
};

const menu = (ev: PointerEvent) => {
	os.popupMenu([{
		icon: 'ti ti-download',
		text: i18n.ts.export,
		action: async () => {
			misskeyApi('export-custom-emojis', {
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
			const file = await selectFile({
				anchorElement: ev.currentTarget ?? ev.target,
				multiple: false,
			});
			misskeyApi('admin/emoji/import-zip', {
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

const setCategoryBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Category',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/set-category-bulk', {
		ids: selectedEmojis.value,
		category: result,
	});
	paginator.reload();
};

const setLicenseBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'License',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/set-license-bulk', {
		ids: selectedEmojis.value,
		license: result,
	});
	paginator.reload();
};

const addTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/add-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	paginator.reload();
};

const removeTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/remove-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	paginator.reload();
};

const setTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/set-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	paginator.reload();
};

const delBulk = async () => {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/delete-bulk', {
		ids: selectedEmojis.value,
	});
	paginator.reload();
};

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.addEmoji,
	handler: add,
}, {
	icon: 'ti ti-dots',
	text: i18n.ts.more,
	handler: menu,
}]);

const headerTabs = computed(() => [{
	key: 'local',
	title: i18n.ts.local,
}, {
	key: 'remote',
	title: i18n.ts.remote,
}]);

definePage(() => ({
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
}));
</script>

<style lang="scss" scoped>
.ogwlenmc {
	> .local {
		.empty {
			margin: var(--MI-margin);
		}

		.ldhfsamy {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: var(--MI-margin) 0;

			> .emoji {
				display: flex;
				align-items: center;
				padding: 11px;
				text-align: left;
				border: solid 1px var(--MI_THEME-panel);

				&:hover {
					border-color: var(--MI_THEME-inputBorderHover);
				}

				&.selected {
					border-color: var(--MI_THEME-accent);
				}

				> .img {
					width: 42px;
					height: 42px;
					object-fit: contain;
				}

				> .body {
					padding: 0 0 0 8px;
					white-space: nowrap;
					overflow: hidden;

					> .name {
						text-overflow: ellipsis;
						overflow: hidden;
					}

					> .info {
						opacity: 0.5;
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}

	> .remote {
		.empty {
			margin: var(--MI-margin);
		}

		.ldhfsamy {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: var(--MI-margin) 0;

			> .emoji {
				display: flex;
				align-items: center;
				padding: 12px;
				text-align: left;

				&:hover {
					color: var(--MI_THEME-accent);
				}

				> .img {
					width: 32px;
					height: 32px;
					object-fit: contain;
				}

				> .body {
					padding: 0 0 0 8px;
					white-space: nowrap;
					overflow: hidden;

					> .name {
						text-overflow: ellipsis;
						overflow: hidden;
					}

					> .info {
						opacity: 0.5;
						font-size: 90%;
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}
}
</style>
