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
				<button v-for="emoji in searchEmojis" :key="emoji.name" class="emoji _button" @click="menu(emoji, $event)">
					<img :src="emoji.url" class="img" :alt="emoji.name"/>
					<div class="body">
						<div class="name _monospace">{{ emoji.name }}</div>
						<div class="info">{{ emoji.aliases.join(' ') }}</div>
					</div>
				</button>
			</div>
		</MkFolder>
		<MkFolder v-for="category in customEmojiCategories" :key="category">
			<template #header>{{ category || $ts.other }}</template>
			<div class="zuvgdzyt">
				<button v-for="emoji in customEmojis.filter(e => e.category === category)" :key="emoji.name" class="emoji _button" @click="menu(emoji, $event)">
					<img :src="emoji.url" class="img" :alt="emoji.name"/>
					<div class="body">
						<div class="name _monospace">{{ emoji.name }}</div>
						<div class="info">{{ emoji.aliases.join(' ') }}</div>
					</div>
				</button>
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
import copyToClipboard from '@client/scripts/copy-to-clipboard';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkSelect,
		MkFolder,
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
		menu(emoji, ev) {
			os.popupMenu([{
				type: 'label',
				text: ':' + emoji.name + ':',
			}, {
				text: this.$ts.copy,
				icon: 'fas fa-copy',
				action: () => {
					copyToClipboard(`:${emoji.name}:`);
					os.success();
				}
			}], ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" scoped>
.driuhtrh {
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

			> .emoji {
				display: flex;
				align-items: center;
				padding: 12px;
				text-align: left;
				border: solid 1px var(--divider);
				border-radius: 8px;

				&:hover {
					border-color: var(--accent);
				}

				> .img {
					width: 42px;
					height: 42px;
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
						font-size: 0.9em;
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}
}
</style>
