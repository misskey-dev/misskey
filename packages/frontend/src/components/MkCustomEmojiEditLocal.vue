<template>
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
	<MkButton inline @click="setLisenceBulk">Set Lisence</MkButton>
	<MkButton inline danger @click="delBulk">Delete</MkButton>
</div>
<MkPagination ref="emojisPaginationComponent" :pagination="pagination" :displayLimit="100">
	<template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
	<template #default="{items}">
		<div :class="$style.root">
			<div v-for="emoji in items" :key="emoji.id">
				<button v-if="emoji.request" class="_panel _button" :class="[{ selected: selectedEmojis.includes(emoji.id) },$style.emoji,$style.emojirequest]" @click="selectMode ? toggleSelect(emoji) : edit(emoji)">
					<img :src="emoji.url" class="img" :alt="emoji.name"/>
					<div class="body">
						<div class="name _monospace">{{ emoji.name }}</div>
						<div class="info">{{ emoji.category }}</div>
					</div>
				</button>
				<button v-else class="_panel _button" :class="[{ selected: selectedEmojis.includes(emoji.id) },$style.emoji]" @click="selectMode ? toggleSelect(emoji) : edit(emoji)">
					<img :src="emoji.url" :class="$style.img" :alt="emoji.name"/>
					<div :class="$style.body">
						<div :class="$style.name" class="_monospace">{{ emoji.name }}</div>
						<div :class="$style.info">{{ emoji.category }}</div>
					</div>
				</button>
			</div>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, shallowRef } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const emojisPaginationComponent = shallowRef<InstanceType<typeof MkPagination>>();

const query = ref(null);
const selectMode = ref(false);
const selectedEmojis = ref<string[]>([]);

const pagination = {
	endpoint: 'admin/emoji/list' as const,
	limit: 30,
	params: computed(() => ({
		query: (query.value && query.value !== '') ? query.value : null,
	})),
};

const selectAll = () => {
	if (selectedEmojis.value.length > 0) {
		selectedEmojis.value = [];
	} else {
		selectedEmojis.value = emojisPaginationComponent.value.items.map(item => item.id);
	}
};

const toggleSelect = (emoji) => {
	if (selectedEmojis.value.includes(emoji.id)) {
		selectedEmojis.value = selectedEmojis.value.filter(x => x !== emoji.id);
	} else {
		selectedEmojis.value.push(emoji.id);
	}
};

const edit = (emoji) => {
	os.popup(defineAsyncComponent(() => import('@/components/MkEmojiEditDialog.vue')), {
		emoji: emoji,
		isRequest: false,
	}, {
		done: result => {
			if (result.updated) {
				emojisPaginationComponent.value.updateItem(result.updated.id, (oldEmoji: any) => ({
					...oldEmoji,
					...result.updated,
				}));
				emojisPaginationComponent.value.reload();
			} else if (result.deleted) {
				emojisPaginationComponent.value.removeItem((item) => item.id === emoji.id);
			}
		},
	}, 'closed');
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
	emojisPaginationComponent.value.reload();
};

const setLisenceBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'License',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/set-license-bulk', {
		ids: selectedEmojis.value,
		license: result,
	});
	emojisPaginationComponent.value.reload();
};

const addTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/add-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	emojisPaginationComponent.value.reload();
};

const removeTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/remove-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	emojisPaginationComponent.value.reload();
};

const setTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/set-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	emojisPaginationComponent.value.reload();
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
	emojisPaginationComponent.value.reload();
};
</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	grid-gap: var(--margin);
}
.emoji {
  display: flex;
  align-items: center;
  padding: 11px;
  text-align: left;
  border: solid 1px var(--panel);
  width: 100%;

  &:hover {
    border-color: var(--inputBorderHover);
  }

  &.selected {
    border-color: var(--accent);
  }
}
.img {
  width: 42px;
  height: 42px;
}
.body {
  padding: 0 0 0 8px;
  white-space: nowrap;
  overflow: hidden;
}
.name {
  text-overflow: ellipsis;
  overflow: hidden;
}

.info {
  opacity: 0.5;
  text-overflow: ellipsis;
  overflow: hidden;
}
.emojirequest {
	--c: rgb(255 196 0 / 15%);;
	background-image: linear-gradient(45deg,var(--c) 16.67%,transparent 16.67%,transparent 50%,var(--c) 50%,var(--c) 66.67%,transparent 66.67%,transparent 100%);
	background-size: 16px 16px;
}
</style>
