<template>
<div class="driuhtrh">
	<div class="query">
		<MkInput v-model="q" class="" :placeholder="$ts.search">
			<template #prefix><i class="fas fa-search"></i></template>
		</MkInput>

		<!-- たくさんあると邪魔
		<div class="tags">
			<span class="tag _button" v-for="tag in tags" :class="{ active: selectedTags.has(tag) }" @click="toggleTag(tag)">{{ tag }}</span>
		</div>
		-->
	</div>

	<MkFolder v-if="searchEmojis" class="emojis">
		<template #header>{{ $ts.searchResult }}</template>
		<div class="zuvgdzyt">
			<XEmoji v-for="emoji in searchEmojis" :key="emoji.name" class="emoji" :emoji="emoji"/>
		</div>
	</MkFolder>
	
	<MkFolder v-for="category in customEmojiCategories" :key="category" class="emojis">
		<template #header>{{ category || $ts.other }}</template>
		<div class="zuvgdzyt">
			<XEmoji v-for="emoji in customEmojis.filter(e => e.category === category)" :key="emoji.name" class="emoji" :emoji="emoji"/>
		</div>
	</MkFolder>
</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkSelect from '@/components/form/select.vue';
import MkFolder from '@/components/ui/folder.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { emojiCategories, emojiTags } from '@/instance';
import XEmoji from './emojis.emoji.vue';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkFolder,
		MkTab,
		XEmoji,
	},

	data() {
		return {
			q: '',
			customEmojiCategories: emojiCategories,
			customEmojis: this.$instance.emojis,
			tags: emojiTags,
			selectedTags: new Set(),
			searchEmojis: null,
		};
	},

	watch: {
		q() { this.search(); },
		selectedTags: {
			handler() {
				this.search();
			},
			deep: true
		},
	},

	methods: {
		search() {
			if ((this.q === '' || this.q == null) && this.selectedTags.size === 0) {
				this.searchEmojis = null;
				return;
			}

			if (this.selectedTags.size === 0) {
				this.searchEmojis = this.customEmojis.filter(emoji => emoji.name.includes(this.q) || emoji.aliases.includes(this.q));
			} else {
				this.searchEmojis = this.customEmojis.filter(emoji => (emoji.name.includes(this.q) || emoji.aliases.includes(this.q)) && [...this.selectedTags].every(t => emoji.aliases.includes(t)));
			}
		},

		toggleTag(tag) {
			if (this.selectedTags.has(tag)) {
				this.selectedTags.delete(tag);
			} else {
				this.selectedTags.add(tag);
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.driuhtrh {
	background: var(--bg);

	> .query {
		background: var(--bg);
		padding: 16px;

		> .tags {
			> .tag {
				display: inline-block;
				margin: 8px 8px 0 0;
				padding: 4px 8px;
				font-size: 0.9em;
				background: var(--accentedBg);
				border-radius: 5px;

				&.active {
					background: var(--accent);
					color: var(--fgOnAccent);
				}
			}
		}
	}

	> .emojis {
		--x-padding: 0 16px;

		.zuvgdzyt {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: 0 var(--margin) var(--margin) var(--margin);
		}
	}
}
</style>
