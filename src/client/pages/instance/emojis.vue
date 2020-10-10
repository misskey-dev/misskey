<template>
<div class="mk-instance-emojis">
	<div class="_section" style="padding: 0;">
		<MkTab v-model:value="tab" :items="[{ label: $t('local'), value: 'local' }, { label: $t('remote'), value: 'remote' }]"/>
	</div>

	<div class="_section">
		<section class="_card _content local" v-if="tab === 'local'">
			<div class="_content">
				<MkPagination :pagination="pagination" class="emojis" ref="emojis">
					<template #empty><span>{{ $t('noCustomEmojis') }}</span></template>
					<template #default="{items}">
						<div class="emoji" v-for="(emoji, i) in items" :key="emoji.id" @click="selected = emoji" :class="{ selected: selected && (selected.id === emoji.id) }">
							<img :src="emoji.url" class="img" :alt="emoji.name"/>
							<div class="body">
								<span class="name">{{ emoji.name }}</span>
								<span class="info">
									<b class="category">{{ emoji.category }}</b>
									<span class="aliases">{{ emoji.aliases.join(' ') }}</span>
								</span>
							</div>
						</div>
					</template>
				</MkPagination>
			</div>
			<div class="_content" v-if="selected">
				<MkInput v-model:value="name"><span>{{ $t('name') }}</span></MkInput>
				<MkInput v-model:value="category" :datalist="categories"><span>{{ $t('category') }}</span></MkInput>
				<MkInput v-model:value="aliases"><span>{{ $t('tags') }}</span></MkInput>
				<MkButton inline primary @click="update"><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
				<MkButton inline :disabled="selected == null" @click="del()"><Fa :icon="faTrashAlt"/> {{ $t('delete') }}</MkButton>
			</div>
			<div class="_footer">
				<MkButton inline primary @click="add"><Fa :icon="faPlus"/> {{ $t('addEmoji') }}</MkButton>
			</div>
		</section>

		<section class="_card _content remote" v-else-if="tab === 'remote'">
			<div class="_content">
				<MkInput v-model:value="host" :debounce="true"><span>{{ $t('host') }}</span></MkInput>
				<MkPagination :pagination="remotePagination" class="emojis" ref="remoteEmojis">
					<template #empty><span>{{ $t('noCustomEmojis') }}</span></template>
					<template #default="{items}">
						<div class="emoji" v-for="(emoji, i) in items" :key="emoji.id" @click="selectedRemote = emoji" :class="{ selected: selectedRemote && (selectedRemote.id === emoji.id) }">
							<img :src="emoji.url" class="img" :alt="emoji.name"/>
							<div class="body">
								<span class="name">{{ emoji.name }}</span>
								<span class="info">{{ emoji.host }}</span>
							</div>
						</div>
					</template>
				</MkPagination>
			</div>
			<div class="_footer">
				<MkButton inline primary :disabled="selectedRemote == null" @click="im()"><Fa :icon="faPlus"/> {{ $t('import') }}</MkButton>
			</div>
		</section>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faSave } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt, faLaugh } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkTab from '@/components/tab.vue';
import { selectFile } from '@/scripts/select-file';
import { unique } from '../../../prelude/array';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkTab,
		MkButton,
		MkInput,
		MkPagination,
	},

	data() {
		return {
			INFO: {
				header: [{
					title: this.$t('customEmojis'),
					icon: faLaugh
				}]
			},
			tab: 'local',
			selected: null,
			selectedRemote: null,
			name: null,
			category: null,
			aliases: null,
			host: '',
			pagination: {
				endpoint: 'admin/emoji/list',
				limit: 10,
			},
			remotePagination: {
				endpoint: 'admin/emoji/list-remote',
				limit: 10,
				params: () => ({
					host: this.host ? this.host : null
				})
			},
			faTrashAlt, faPlus, faLaugh, faSave
		}
	},

	computed: {
		categories() {
			if (this.$store.state.instance.meta) {
				return unique(this.$store.state.instance.meta.emojis.map((x: any) => x.category || '').filter((x: string) => x !== ''));
			} else {
				return [];
			}
		}
	},

	watch: {
		host() {
			this.$refs.remoteEmojis.reload();
		},

		selected() {
			this.name = this.selected ? this.selected.name : null;
			this.category = this.selected ? this.selected.category : null;
			this.aliases = this.selected ? this.selected.aliases.join(' ') : null;
		}
	},

	methods: {
		async add(e) {
			const files = await selectFile(e.currentTarget || e.target, null, true);

			const dialog = os.dialog({
				type: 'waiting',
				text: this.$t('doing') + '...',
				showOkButton: false,
				showCancelButton: false,
				cancelableByBgClick: false
			});
			
			Promise.all(files.map(file => os.api('admin/emoji/add', {
				fileId: file.id,
			})))
			.then(() => {
				this.$refs.emojis.reload();
				os.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			})
			.finally(() => {
				dialog.close();
			});
		},

		async update() {
			await os.api('admin/emoji/update', {
				id: this.selected.id,
				name: this.name,
				category: this.category,
				aliases: this.aliases.split(' '),
			});

			os.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});

			this.$refs.emojis.reload();
		},

		async del() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.selected.name }),
				showCancelButton: true
			});
			if (canceled) return;

			os.api('admin/emoji/remove', {
				id: this.selected.id
			}).then(() => {
				this.$refs.emojis.reload();
			});
		},

		im() {
			os.api('admin/emoji/copy', {
				emojiId: this.selectedRemote.id,
			}).then(() => {
				this.$refs.emojis.reload();
				os.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				os.dialog({
					type: 'error',
					text: e
				});
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.mk-instance-emojis {
	> ._section {
		> .local {
			> ._content {
				max-height: 300px;
				overflow: auto;
				
				> .emojis {
					> .emoji {
						display: flex;
						align-items: center;

						&.selected {
							background: var(--accent);
							box-shadow: 0 0 0 8px var(--accent);
							color: #fff;
						}

						> .img {
							width: 50px;
							height: 50px;
						}

						> .body {
							padding: 8px;

							> .name {
								display: block;
							}

							> .info {
								opacity: 0.5;

								> .category {
									margin-right: 16px;
								}

								> .aliases {
									font-style: oblique;
								}
							}
						}
					}
				}
			}
		}

		> .remote {
			> ._content {
				max-height: 300px;
				overflow: auto;
				
				> .emojis {
					> .emoji {
						display: flex;
						align-items: center;

						&.selected {
							background: var(--accent);
							box-shadow: 0 0 0 8px var(--accent);
							color: #fff;
						}

						> .img {
							width: 32px;
							height: 32px;
						}

						> .body {
							padding: 0 8px;

							> .name {
								display: block;
							}

							> .info {
								opacity: 0.5;
							}
						}
					}
				}
			}
		}
	}
}
</style>
