<template>
<div class="mk-instance-emojis">
	<portal to="icon"><fa :icon="faLaugh"/></portal>
	<portal to="title">{{ $t('customEmojis') }}</portal>
	<section class="_card local">
		<div class="_title"><fa :icon="faLaugh"/> {{ $t('customEmojis') }}</div>
		<div class="_content">
			<input ref="file" type="file" style="display: none;" @change="onChangeFile"/>
			<mk-pagination :pagination="pagination" class="emojis" ref="emojis">
				<template #empty><span>{{ $t('noCustomEmojis') }}</span></template>
				<template #default="{items}">
					<div class="emoji" v-for="(emoji, i) in items" :key="emoji.id" @click="selected = emoji" :class="{ selected: selected && (selected.id === emoji.id) }">
						<img :src="emoji.url" class="img" :alt="emoji.name"/>
						<div class="body">
							<span class="name">{{ emoji.name }}</span>
						</div>
					</div>
				</template>
			</mk-pagination>
		</div>
		<div class="_footer">
			<mk-button inline primary @click="add()"><fa :icon="faPlus"/> {{ $t('addEmoji') }}</mk-button>
			<mk-button inline :disabled="selected == null" @click="del()"><fa :icon="faTrashAlt"/> {{ $t('delete') }}</mk-button>
		</div>
	</section>
	<section class="_card remote">
		<div class="_title"><fa :icon="faLaugh"/> {{ $t('customEmojisOfRemote') }}</div>
		<div class="_content">
			<mk-input v-model="host" :debounce="true" style="margin-top: 0;"><span>{{ $t('host') }}</span></mk-input>
			<mk-pagination :pagination="remotePagination" class="emojis" ref="remoteEmojis">
				<template #empty><span>{{ $t('noCustomEmojis') }}</span></template>
				<template #default="{items}">
					<div class="emoji" v-for="(emoji, i) in items" :key="emoji.id" @click="selectedRemote = emoji" :class="{ selected: selectedRemote && (selectedRemote.id === emoji.id) }">
						<img :src="emoji.url" class="img" :alt="emoji.name"/>
						<div class="body">
							<span class="name">{{ emoji.name }}</span>
							<span class="host">{{ emoji.host }}</span>
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
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt, faLaugh } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkPagination from '../../components/ui/pagination.vue';
import { apiUrl } from '../../config';

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
			name: null,
			selected: null,
			selectedRemote: null,
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
			faTrashAlt, faPlus, faLaugh
		}
	},

	watch: {
		host() {
			this.$refs.remoteEmojis.reload();
		}
	},

	methods: {
		async add() {
			const { canceled: canceled, result: name } = await this.$root.dialog({
				title: this.$t('emojiName'),
				input: true
			});
			if (canceled) return;

			this.name = name;

			(this.$refs.file as any).click();
		},

		onChangeFile() {
			const [file] = Array.from((this.$refs.file as any).files);
			if (file == null) return;
			
			const data = new FormData();
			data.append('file', file);
			data.append('name', this.name);
			data.append('i', this.$store.state.i.token);

			const dialog = this.$root.dialog({
				type: 'waiting',
				text: this.$t('uploading') + '...',
				showOkButton: false,
				showCancelButton: false,
				cancelableByBgClick: false
			});

			fetch(apiUrl + '/admin/emoji/add', {
				method: 'POST',
				body: data
			})
			.then(response => response.json())
			.then(f => {
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

						> .host {
							opacity: 0.5;
						}
					}
				}
			}
		}
	}
}
</style>
