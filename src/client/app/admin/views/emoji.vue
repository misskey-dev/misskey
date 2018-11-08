<template>
<div class="tumhkfkmgtvzljezfvmgkeurkfncshbe">
	<ui-card>
		<div slot="title"><fa icon="plus"/> {{ $t('add-emoji.title') }}</div>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-input v-model="name">
					<span>{{ $t('add-emoji.name') }}</span>
					<span slot="desc">{{ $t('add-emoji.name-desc') }}</span>
				</ui-input>
				<ui-input v-model="aliases">
					<span>{{ $t('add-emoji.aliases') }}</span>
					<span slot="desc">{{ $t('add-emoji.aliases-desc') }}</span>
				</ui-input>
			</ui-horizon-group>
			<ui-input v-model="url">
				<i slot="icon"><fa icon="link"/></i>
				<span>{{ $t('add-emoji.url') }}</span>
			</ui-input>
			<ui-info>{{ $t('add-emoji.info') }}</ui-info>
			<ui-button @click="add">{{ $t('add-emoji.add') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title"><fa :icon="['far', 'grin']"/> {{ $t('emojis.title') }}</div>
		<section v-for="emoji in emojis">
			<img :src="emoji.url" :alt="emoji.name" style="width: 64px;"/>
			<ui-horizon-group inputs>
				<ui-input v-model="emoji.name">
					<span>{{ $t('add-emoji.name') }}</span>
				</ui-input>
				<ui-input v-model="emoji.aliases">
					<span>{{ $t('add-emoji.aliases') }}</span>
				</ui-input>
			</ui-horizon-group>
			<ui-input v-model="emoji.url">
				<i slot="icon"><fa icon="link"/></i>
				<span>{{ $t('add-emoji.url') }}</span>
			</ui-input>
			<ui-horizon-group>
				<ui-button @click="updateEmoji(emoji)"><fa :icon="['far', 'save']"/> {{ $t('emojis.update') }}</ui-button>
				<ui-button @click="removeEmoji(emoji)"><fa :icon="['far', 'trash-alt']"/> {{ $t('emojis.remove') }}</ui-button>
			</ui-horizon-group>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';

export default Vue.extend({
	i18n: i18n('admin/views/emoji.vue'),
	data() {
		return {
			name: '',
			url: '',
			aliases: '',
			emojis: []
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
				this.$swal({
					type: 'success',
					text: this.$t('add-emoji.added')
				});
				this.fetchEmojis();
			}).catch(e => {
				this.$swal({
					type: 'error',
					text: e
				});
			});
		},

		fetchEmojis() {
			this.$root.api('admin/emoji/list').then(emojis => {
				emojis.reverse();
				emojis.forEach(e => e.aliases = (e.aliases || []).join(' '));
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
				this.$swal({
					type: 'success',
					text: this.$t('updated')
				});
			}).catch(e => {
				this.$swal({
					type: 'error',
					text: e
				});
			});
		},

		removeEmoji(emoji) {
			this.$swal({
				type: 'warning',
				text: this.$t('remove-emoji.are-you-sure').replace('$1', emoji.name),
				showCancelButton: true
			}).then(res => {
				if (!res.value) return;

				this.$root.api('admin/emoji/remove', {
					id: emoji.id
				}).then(() => {
					this.$swal({
						type: 'success',
						text: this.$t('remove-emoji.removed')
					});
					this.fetchEmojis();
				}).catch(e => {
					this.$swal({
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
.tumhkfkmgtvzljezfvmgkeurkfncshbe
	@media (min-width 500px)
		padding 16px

</style>
