<template>
<div>
	<ui-card>
		<template #title><fa icon="plus"/> {{ $t('add-emoji.title') }}</template>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-input v-model="name">
					<span>{{ $t('add-emoji.name') }}</span>
					<template #desc>{{ $t('add-emoji.name-desc') }}</template>
				</ui-input>
				<ui-input v-model="aliases">
					<span>{{ $t('add-emoji.aliases') }}</span>
					<template #desc>{{ $t('add-emoji.aliases-desc') }}</template>
				</ui-input>
			</ui-horizon-group>
			<ui-input v-model="url">
				<template #icon><fa icon="link"/></template>
				<span>{{ $t('add-emoji.url') }}</span>
			</ui-input>
			<ui-info>{{ $t('add-emoji.info') }}</ui-info>
			<ui-button @click="add">{{ $t('add-emoji.add') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faGrin"/> {{ $t('emojis.title') }}</template>
		<section v-for="emoji in emojis" class="oryfrbft">
			<div>
				<img :src="emoji.url" :alt="emoji.name" style="width: 64px;"/>
			</div>
			<div>
				<ui-horizon-group>
					<ui-input v-model="emoji.name">
						<span>{{ $t('add-emoji.name') }}</span>
					</ui-input>
					<ui-input v-model="emoji.aliases">
						<span>{{ $t('add-emoji.aliases') }}</span>
					</ui-input>
				</ui-horizon-group>
				<ui-input v-model="emoji.url">
					<template #icon><fa icon="link"/></template>
					<span>{{ $t('add-emoji.url') }}</span>
				</ui-input>
				<ui-horizon-group class="fit-bottom">
					<ui-button @click="updateEmoji(emoji)"><fa :icon="['far', 'save']"/> {{ $t('emojis.update') }}</ui-button>
					<ui-button @click="removeEmoji(emoji)"><fa :icon="['far', 'trash-alt']"/> {{ $t('emojis.remove') }}</ui-button>
				</ui-horizon-group>
			</div>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faGrin } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/emoji.vue'),
	data() {
		return {
			name: '',
			url: '',
			aliases: '',
			emojis: [],
			faGrin
		};
	},

	mounted() {
		this.fetchEmojis();
	},

	methods: {
		add() {
			this.$root.api('admin/emoji/add', {
				name: this.name,
				url: this.url,
				aliases: this.aliases.split(' ').filter(x => x.length > 0)
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					text: this.$t('add-emoji.added')
				});
				this.fetchEmojis();
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		},

		fetchEmojis() {
			this.$root.api('admin/emoji/list').then(emojis => {
				emojis.reverse();
				for (const e of emojis) {
					e.aliases = (e.aliases || []).join(' ');
				}
				this.emojis = emojis;
			});
		},

		updateEmoji(emoji) {
			this.$root.api('admin/emoji/update', {
				id: emoji.id,
				name: emoji.name,
				url: emoji.url,
				aliases: emoji.aliases.split(' ').filter(x => x.length > 0)
			}).then(() => {
				this.$root.dialog({
					type: 'success',
					text: this.$t('updated')
				});
			}).catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e
				});
			});
		},

		removeEmoji(emoji) {
			this.$root.dialog({
				type: 'warning',
				text: this.$t('remove-emoji.are-you-sure').replace('$1', emoji.name),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;

				this.$root.api('admin/emoji/remove', {
					id: emoji.id
				}).then(() => {
					this.$root.dialog({
						type: 'success',
						text: this.$t('remove-emoji.removed')
					});
					this.fetchEmojis();
				}).catch(e => {
					this.$root.dialog({
						type: 'error',
						text: e
					});
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.oryfrbft
	@media (min-width 500px)
		display flex

	> div:first-child
		@media (max-width 500px)
			padding-bottom 16px

		> img
			vertical-align bottom

	> div:last-child
		flex 1

		@media (min-width 500px)
			padding-left 16px

</style>
