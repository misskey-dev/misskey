<template>
<div class="tumhkfkmgtvzljezfvmgkeurkfncshbe">
	<ui-card>
		<div slot="title">%fa:plus% %i18n:@add-emoji.title%</div>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-input v-model="name">
					<span>%i18n:@add-emoji.name%</span>
					<span slot="text">%i18n:@add-emoji.name-desc%</span>
				</ui-input>
				<ui-input v-model="aliases">
					<span>%i18n:@add-emoji.aliases%</span>
					<span slot="text">%i18n:@add-emoji.aliases-desc%</span>
				</ui-input>
			</ui-horizon-group>
			<ui-input v-model="url">
				<span>%i18n:@add-emoji.url%</span>
			</ui-input>
			<ui-info>%i18n:@add-emoji.info%</ui-info>
			<ui-button @click="add">%i18n:@add-emoji.add%</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<div slot="title">%fa:grin R% %i18n:@emojis.title%</div>
		<section v-for="emoji in emojis">
			<img :src="emoji.url" :alt="emoji.name" style="width: 64px;"/>
			<ui-horizon-group inputs>
				<ui-input v-model="emoji.name">
					<span>%i18n:@add-emoji.name%</span>
				</ui-input>
				<ui-input v-model="emoji.aliases">
					<span>%i18n:@add-emoji.aliases%</span>
				</ui-input>
			</ui-horizon-group>
			<ui-input v-model="emoji.url">
				<span>%i18n:@add-emoji.url%</span>
			</ui-input>
			<ui-horizon-group>
				<ui-button @click="updateEmoji(emoji)">%fa:save R% %i18n:@emojis.update%</ui-button>
				<ui-button @click="removeEmoji(emoji)">%fa:trash-alt R% %i18n:@emojis.remove%</ui-button>
			</ui-horizon-group>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
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
			(this as any).api('admin/emoji/add', {
				name: this.name,
				url: this.url,
				aliases: this.aliases.split(' ').filter(x => x.length > 0)
			}).then(() => {
				this.$swal({
					type: 'success',
					text: '%i18n:@add-emoji.added%'
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
			(this as any).api('admin/emoji/list').then(emojis => {
				emojis.reverse();
				emojis.forEach(e => e.aliases = (e.aliases || []).join(' '));
				this.emojis = emojis;
			});
		},

		updateEmoji(emoji) {
			(this as any).api('admin/emoji/update', {
				id: emoji.id,
				name: emoji.name,
				url: emoji.url,
				aliases: emoji.aliases.split(' ').filter(x => x.length > 0)
			}).then(() => {
				this.$swal({
					type: 'success',
					text: '%i18n:@updated%'
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
				text: '%i18n:@remove-emoji.are-you-sure%'.replace('$1', emoji.name),
				showCancelButton: true
			}).then(res => {
				if (!res.value) return;

				(this as any).api('admin/emoji/remove', {
					id: emoji.id
				}).then(() => {
					this.$swal({
						type: 'success',
						text: '%i18n:@remove-emoji.removed%'
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
