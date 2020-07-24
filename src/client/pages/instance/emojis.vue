<template>
<div class="mk-instance-emojis">
	<portal to="icon"><fa :icon="faLaugh"/></portal>
	<portal to="title">{{ $t('customEmojis') }}</portal>

	<section class="_card local">
		<div class="_title"><fa :icon="faLaugh"/> {{ $t('customEmojis') }}</div>
		<div class="_content">
			<mk-pagination :pagination="pagination" class="emojis" ref="emojis">
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
			</mk-pagination>
		</div>
		<div class="_content" v-if="selected">
			<mk-input v-model="name"><span>{{ $t('name') }}</span></mk-input>
			<mk-input v-model="category" :datalist="categories"><span>{{ $t('category') }}</span></mk-input>
			<mk-input v-model="aliases"><span>{{ $t('tags') }}</span></mk-input>
			<mk-button inline primary @click="update"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
			<mk-button inline :disabled="selected == null" @click="del()"><fa :icon="faTrashAlt"/> {{ $t('delete') }}</mk-button>
		</div>
		<div class="_footer">
			<mk-button inline primary @click="add"><fa :icon="faPlus"/> {{ $t('addEmoji') }}</mk-button>
		</div>
	</section>
	<section class="_card remote">
		<div class="_title"><fa :icon="faLaugh"/> {{ $t('customEmojisOfRemote') }}</div>
		<div class="_content">
			<mk-input v-model="host" :debounce="true"><span>{{ $t('host') }}</span></mk-input>
			<mk-pagination :pagination="remotePagination" class="emojis" ref="remoteEmojis">
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
			</mk-pagination>
		</div>
		<div class="_footer">
			<mk-button inline primary :disabled="selectedRemote == null" @click="im()"><fa :icon="faPlus"/> {{ $t('import') }}</mk-button>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faSave } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt, faLaugh } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkPagination from '../../components/ui/pagination.vue';
import { selectFile } from '../../scripts/select-file';
import { unique } from '../../../prelude/array';

export default Vue.extend({
	metaInfo() {
		return {
			title: `${this.$t('customEmojis')} | ${this.$t('instance')}`
		};
	},

	components: {
		MkButton,
		MkInput,
		MkPagination,
	},

	data() {
		return {
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
			const files = await selectFile(this, e.currentTarget || e.target, null, true);

			const dialog = this.$root.dialog({
				type: 'waiting',
				text: this.$t('doing') + '...',
				showOkButton: false,
				showCancelButton: false,
				cancelableByBgClick: false
			});
			
			Promise.all(files.map(file => this.$root.api('admin/emoji/add', {
				fileId: file.id,
			})))
			.then(() => {
				this.$refs.emojis.reload();
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			})
			.finally(() => {
				dialog.close();
			});
		},

		async update() {
			await this.$root.api('admin/emoji/update', {
				id: this.selected.id,
				name: this.name,
				category: this.category,
				aliases: this.aliases.split(' '),
			});

			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});

			this.$refs.emojis.reload();
		},

		async del() {
			const { canceled } = await this.$root.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.selected.name }),
				showCancelButton: true
			});
			if (canceled) return;

			this.$root.api('admin/emoji/remove', {
				id: this.selected.id
			}).then(() => {
				this.$refs.emojis.reload();
			});
		},

		im() {
			this.$root.api('admin/emoji/copy', {
				emojiId: this.selectedRemote.id,
			}).then(() => {
				this.$refs.emojis.reload();
				this.$root.dialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			}).catch(e => {
				this.$root.dialog({
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
</style>
