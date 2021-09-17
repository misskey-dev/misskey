<template>
<div class="driuhtrh">
	<div class="query">
		<MkInput v-model="q" class="_inputNoTopMargin _inputNoBottomMargin" :placeholder="$ts.search">
			<template #prefix><i class="fas fa-search"></i></template>
		</MkInput>
	</div>

	<div class="emojis">
		<MkFolder v-if="searchEmojis">
			<template #header>{{ $ts.searchResult }}</template>
			<div class="zuvgdzyt">
				<XEmoji v-for="emoji in searchEmojis" :key="emoji.name" class="emoji" :emoji="emoji"/>
			</div>
		</MkFolder>
	</div>

	<div class="emojis">
		<MkFolder v-for="category in customEmojiCategories" :key="category">
			<template #header>{{ category || $ts.other }}</template>
			<div class="zuvgdzyt">
				<XEmoji v-for="emoji in customEmojis.filter(e => e.category === category)" :key="emoji.name" class="emoji" :emoji="emoji"/>
			</div>
		</MkFolder>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkSelect from '@client/components/ui/select.vue';
import MkFolder from '@client/components/ui/folder.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { emojiCategories } from '@client/instance';
import XEmoji from './emojis.emoji.vue';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkFolder,
		XEmoji,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.customEmojis,
				icon: 'fas fa-laugh'
			},
			q: '',
			customEmojiCategories: emojiCategories,
			customEmojis: this.$instance.emojis,
			searchEmojis: null,
		}
	},

	watch: {
		q() {
			if (this.q === '' || this.q == null) {
				this.searchEmojis = null;
				return;
			}

			this.searchEmojis = this.customEmojis.filter(e => e.name.includes(this.q) || e.aliases.includes(this.q));
		}
	},

	methods: {
	}
});
</script>

<style lang="scss" scoped>
.driuhtrh {
	background: var(--bg);

	> .query {
		background: var(--bg);
		padding: 16px;
	}

	> .emojis {
		.zuvgdzyt {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: 0 var(--margin) var(--margin) var(--margin);
		}
	}
}
</style>
