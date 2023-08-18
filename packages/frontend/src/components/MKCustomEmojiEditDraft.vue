<template>
<MkPagination ref="emojisDraftPaginationComponent" :pagination="paginationDraft">
	<template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
	<template #default="{items}">
		<div class="ldhfsamy">
			<template v-for="emoji in items" :key="emoji.id">
				<div class="emoji _panel">
					<div class="img">
						<div class="imgLight"><img :src="emoji.url" :alt="emoji.name"/></div>
						<div class="imgDark"><img :src="emoji.url" :alt="emoji.name"/></div>
					</div>
					<div class="info">
						<div class="name _monospace">{{ i18n.ts.name }}: {{ emoji.name }}</div>
						<div class="category">{{ i18n.ts.category }}:{{ emoji.category }}</div>
						<div class="aliases">{{ i18n.ts.tags }}:{{ emoji.aliases.join(' ') }}</div>
						<div class="license">{{ i18n.ts.license }}:{{ emoji.license }}</div>
					</div>
					<div class="edit-button">
						<button class="edit _button" @click="editDraft(emoji)">
							{{ i18n.ts.edit }}
						</button>
						<button class="draft _button" @click="undrafted(emoji)">
							{{ i18n.ts.undrafted }}
						</button>
						<button class="delete _button" @click="deleteDraft(emoji)">
							{{ i18n.ts.delete }}
						</button>
					</div>
				</div>
			</template>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, shallowRef } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const emojisDraftPaginationComponent = shallowRef<InstanceType<typeof MkPagination>>();

const query = ref(null);

const paginationDraft = {
	endpoint: 'admin/emoji/list' as const,
	limit: 30,
	params: computed(() => ({
		query: (query.value && query.value !== '') ? query.value : null,
		draft: true,
	})),
};

const editDraft = (emoji) => {
	os.popup(defineAsyncComponent(() => import('@/components/MkEmojiEditDialog.vue')), {
		emoji: emoji,
		isRequest: false,
	}, {
		done: result => {
			if (result.updated) {
				emojisDraftPaginationComponent.value.updateItem(result.updated.id, (oldEmoji: any) => ({
					...oldEmoji,
					...result.updated,
				}));
				emojisDraftPaginationComponent.value.reload();
			} else if (result.deleted) {
				emojisDraftPaginationComponent.value.removeItem((item) => item.id === emoji.id);
				emojisDraftPaginationComponent.value.reload();
			}
		},
	}, 'closed');
};

async function undrafted(emoji) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('undraftAreYouSure', { x: emoji.name }),
	});
	if (canceled) return;

	await os.api('admin/emoji/update', {
		id: emoji.id,
		name: emoji.name,
		category: emoji.category,
		aliases: emoji.aliases,
		license: emoji.license,
		draft: false,
		isSensitive: emoji.isSensitive,
		localOnly: emoji.localOnly, 
		roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction,
	});

	emojisDraftPaginationComponent.value.removeItem((item) => item.id === emoji.id);
	emojisDraftPaginationComponent.value.reload();
}

async function deleteDraft(emoji) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: emoji.name }),
	});
	if (canceled) return;

	os.api('admin/emoji/delete', {
		id: emoji.id,
	}).then(() => {
		emojisDraftPaginationComponent.value.removeItem((item) => item.id === emoji.id);
		emojisDraftPaginationComponent.value.reload();
	});
}
</script>

<style lang="scss" scoped>
.empty {
	margin: var(--margin);
}

.ldhfsamy {
	> .emoji {
		display: grid;
		grid-template-rows: 40px 1fr;
		grid-template-columns: 1fr 150px;
		align-items: center;
		padding: 11px;
		text-align: left;
		border: solid 1px var(--panel);
		width: 100%;
		margin: 10px;

		> .img {
			display: grid;
			grid-row: 1;
			grid-column: 1/ span 2;
			grid-template-columns: 50% 50%;
			place-content: center;
			place-items: center;

			> .imgLight {
				display: grid;
				grid-column: 1;
				background-color: #fff;
				
				> img {
					max-height: 30px;
					max-width: 100%;
				}
			}

			> .imgDark {
				display: grid;
				grid-column: 2;
				background-color: #000;

				> img {
					max-height: 30px;
					max-width: 100%;
				}
			}
		}

		> .info {
			display: grid;
			grid-row: 2;
			grid-template-rows: 30px 30px 30px;

			> .name {
				grid-row: 1;
				text-overflow: ellipsis;
				overflow: hidden;
			}

			> .category {
				grid-row: 2;
				text-overflow: ellipsis;
				overflow: hidden;
			}

			> .aliases {
				grid-row: 3;
				text-overflow: ellipsis;
				overflow: hidden;
			}

			> .license {
				grid-row: 4;
				text-overflow: ellipsis;
				overflow: hidden;
			}
		}

		> .edit-button {
			display: grid;
			grid-row: 2;
			grid-template-rows: 30px 30px 30px;

			> .edit {
				grid-row: 1;
				background-color: var(--buttonBg);
				margin: 2px;

				&:hover {
					color: var(--accent);
				}
			}

			> .draft {
				grid-row: 2;
				background-color: var(--buttonBg);
				margin: 2px;

				&:hover {
					color: var(--accent);
				}
			}

			> .delete {
				background-color: var(--buttonBg);
				grid-row: 3;
				margin: 2px;

				&:hover {
					color: var(--accent);
				}
			}
		}
	}
}
</style>
