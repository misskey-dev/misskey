<template>
<MkSpacer :content-max="900">
	<div class="ogwlenmc">
		<div v-if="tab === 'local'" class="local">
			<MkInput v-model="query" :debounce="true" type="search">
				<template #prefix><i class="fas fa-search"></i></template>
				<template #label>{{ $ts.search }}</template>
			</MkInput>
			<MkPagination ref="emojis" :pagination="pagination">
				<template #empty><span>{{ $ts.noCustomEmojis }}</span></template>
				<template v-slot="{items}">
					<div class="ldhfsamy">
						<button v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" @click="edit(emoji)">
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
			<div class="_inputSplit">
				<MkInput v-model="queryRemote" :debounce="true" type="search">
					<template #prefix><i class="fas fa-search"></i></template>
					<template #label>{{ $ts.search }}</template>
				</MkInput>
				<MkInput v-model="host" :debounce="true">
					<template #label>{{ $ts.host }}</template>
				</MkInput>
			</div>
			<MkPagination ref="remoteEmojis" :pagination="remotePagination">
				<template #empty><span>{{ $ts.noCustomEmojis }}</span></template>
				<template v-slot="{items}">
					<div class="ldhfsamy">
						<div v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" @click="remoteMenu(emoji, $event)">
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
</MkSpacer>
</template>

<script lang="ts">
import { computed, defineComponent, toRef } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkTab from '@/components/tab.vue';
import { selectFiles } from '@/scripts/select-file';
import * as os from '@/os';
import * as symbols from '@/symbols';

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
				}, {
					icon: 'fas fa-ellipsis-h',
					handler: this.menu,
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
			const files = await selectFiles(e.currentTarget || e.target, null);

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
		},

		menu(ev) {
			os.popupMenu([{
				icon: 'fas fa-download',
				text: this.$ts.export,
				action: async () => {
					os.api('export-custom-emojis', {
					})
					.then(() => {
						os.alert({
							type: 'info',
							text: this.$ts.exportRequested,
						});
					}).catch((e) => {
						os.alert({
							type: 'error',
							text: e.message,
						});
					});
				}
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
			margin: var(--margin) 0;
	
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
			margin: var(--margin) 0;

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
