<template>
<div>
	<portal to="header"><fa :icon="faSatelliteDish"/>{{ channelId ? $t('_channel.edit') : $t('_channel.create') }}</portal>

	<div class="_card">
		<div class="_content">
			<mk-input v-model:value="name">{{ $t('name') }}</mk-input>

			<mk-textarea v-model:value="description">{{ $t('description') }}</mk-textarea>

			<div class="banner">
				<mk-button v-if="bannerId == null" @click="setBannerImage"><fa :icon="faPlus"/> {{ $t('_channel.setBanner') }}</mk-button>
				<div v-else-if="bannerUrl">
					<img :src="bannerUrl" style="width: 100%;"/>
					<mk-button @click="removeBannerImage()"><fa :icon="faTrashAlt"/> {{ $t('_channel.removeBanner') }}</mk-button>
				</div>
			</div>
		</div>
		<div class="_footer">
			<mk-button @click="save()" primary><fa :icon="faSave"/> {{ channelId ? $t('save') : $t('create') }}</mk-button>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faSatelliteDish } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkTextarea from '../components/ui/textarea.vue';
import MkButton from '../components/ui/button.vue';
import MkInput from '../components/ui/input.vue';
import { selectFile } from '../scripts/select-file';

export default defineComponent({
	components: {
		MkTextarea, MkButton, MkInput,
	},

	props: {
		channelId: {
			type: String,
			required: false
		},
	},

	data() {
		return {
			channel: null,
			name: null,
			description: null,
			bannerUrl: null,
			bannerId: null,
			faSave, faTrashAlt, faPlus,faSatelliteDish,
		};
	},

	watch: {
		async bannerId() {
			if (this.bannerId == null) {
				this.bannerUrl = null;
			} else {
				this.bannerUrl = (await this.$root.api('drive/files/show', {
					fileId: this.bannerId,
				})).url;
			}
		},
	},

	async created() {
		if (this.channelId) {
			this.channel = await this.$root.api('channels/show', {
				channelId: this.channelId,
			});

			this.name = this.channel.name;
			this.description = this.channel.description;
			this.bannerId = this.channel.bannerId;
			this.bannerUrl = this.channel.bannerUrl;
		}
	},

	methods: {
		save() {
			const params = {
				name: this.name,
				description: this.description,
				bannerId: this.bannerId,
			};

			if (this.channelId) {
				params.channelId = this.channelId;
				this.$root.api('channels/update', params)
				.then(channel => {
					this.$root.showDialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				});
			} else {
				this.$root.api('channels/create', params)
				.then(channel => {
					this.$root.showDialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
					this.$router.push(`/channels/${channel.id}`);
				});
			}
		},

		setBannerImage(e) {
			selectFile(this, e.currentTarget || e.target, null, false).then(file => {
				this.bannerId = file.id;
			});
		},

		removeBannerImage() {
			this.bannerId = null;
		}
	}
});
</script>

<style lang="scss" scoped>

</style>
