<template>
<div class="ogwlenmc">
	<div class="local" v-if="tab === 'local'">
		<MkInput v-model="query" :debounce="true" type="search" style="margin: var(--margin);">
			<template #prefix><i class="fas fa-search"></i></template>
			<template #label>{{ $ts.search }}</template>
		</MkInput>
		<MkPagination :pagination="pagination" ref="emojis">
			<template #empty><span>{{ $ts.noCustomEmojis }}</span></template>
			<template #default="{items}">
				<div class="ldhfsamy">
					<button class="emoji _panel _button" v-for="emoji in items" :key="emoji.id" @click="edit(emoji)">
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

	<div class="remote" v-else-if="tab === 'remote'">
		<MkInput v-model="queryRemote" :debounce="true" type="search" style="margin: var(--margin);">
			<template #prefix><i class="fas fa-search"></i></template>
			<template #label>{{ $ts.search }}</template>
		</MkInput>
		<MkInput v-model="host" :debounce="true" style="margin: var(--margin);">
			<template #label>{{ $ts.host }}</template>
		</MkInput>
		<MkPagination :pagination="remotePagination" ref="remoteEmojis">
			<template #empty><span>{{ $ts.noCustomEmojis }}</span></template>
			<template #default="{items}">
				<div class="ldhfsamy">
					<div class="emoji _panel _button" v-for="emoji in items" :key="emoji.id" @click="remoteMenu(emoji, $event)">
						<img :src="emoji.url" class="img" :alt="emoji.name"/>
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
</template>

<script lang="ts">
import { computed, defineComponent, toRef } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/form/input.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import MkTab from '@client/components/tab.vue';
import { selectFile } from '@client/scripts/select-file';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkTab,
		MkButton,
		MkInput,
		MkPagination,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.customEmojis,
				icon: 'fas fa-laugh',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-plus',
					text: this.$ts.addEmoji,
					handler: this.add,
				}],
				tabs: [{
					active: this.tab === 'local',
					title: this.$ts.local,
					onClick: () => { this.tab = 'local'; },
				}, {
					active: this.tab === 'remote',
					title: this.$ts.remote,
					onClick: () => { this.tab = 'remote'; },
				},]
			})),
			tab: 'local',
			query: null,
			queryRemote: null,
			host: '',
			pagination: {
				endpoint: 'admin/emoji/list',
				limit: 30,
				params: computed(() => ({
					query: (this.query && this.query !== '') ? this.query : null
				}))
			},
			remotePagination: {
				endpoint: 'admin/emoji/list-remote',
				limit: 30,
				params: computed(() => ({
					query: (this.queryRemote && this.queryRemote !== '') ? this.queryRemote : null,
					host: (this.host && this.host !== '') ? this.host : null
				}))
			},
		}
	},

	async mounted() {
		this.$emit('info', toRef(this, symbols.PAGE_INFO));
	},

	methods: {
		async add(e) {
			const files = await selectFile(e.currentTarget || e.target, null, true);

			const promise = Promise.all(files.map(file => os.api('admin/emoji/add', {
				fileId: file.id,
			})));
			promise.then(() => {
				this.$refs.emojis.reload();
			});
			os.promiseDialog(promise);
		},

		edit(emoji) {
			os.popup(import('./emoji-edit-dialog.vue'), {
				emoji: emoji
			}, {
				done: result => {
					if (result.updated) {
						this.$refs.emojis.replaceItem(item => item.id === emoji.id, {
							...emoji,
							...result.updated
						});
					} else if (result.deleted) {
						this.$refs.emojis.removeItem(item => item.id === emoji.id);
					}
				},
			}, 'closed');
		},

		im(emoji) {
			os.apiWithDialog('admin/emoji/copy', {
				emojiId: emoji.id,
			});
		},

		remoteMenu(emoji, ev) {
			os.popupMenu([{
				type: 'label',
				text: ':' + emoji.name + ':',
			}, {
				text: this.$ts.import,
				icon: 'fas fa-plus',
				action: () => { this.im(emoji) }
			}], ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" scoped>
.ogwlenmc {
	> .local {
	  .empty {
    	margin: var(--margin);
		}
		
		.ldhfsamy {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: var(--margin);
	
			> .emoji {
				display: flex;
				align-items: center;
				padding: 12px;
				text-align: left;

				&:hover {
					color: var(--accent);
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
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}

	> .remote {
	  .empty {
      margin: var(--margin);
    }
								
		.ldhfsamy {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: var(--margin);

			> .emoji {
				display: flex;
				align-items: center;
				padding: 12px;
				text-align: left;

				&:hover {
					color: var(--accent);
				}

				> .img {
					width: 32px;
					height: 32px;
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
