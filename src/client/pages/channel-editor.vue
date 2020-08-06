<template>
<div class="_panel">
	<div class="_content">
		<mk-input v-model="name">{{ $t('name') }}</mk-input>

		<mk-textarea v-model="description">{{ $t('description') }}</mk-textarea>

		<div class="banner">
			<mk-button v-if="bannerId == null && !readonly" @click="setEyeCatchingImage()"><fa :icon="faPlus"/> {{ $t('_channel.setBanner') }}</mk-button>
			<div v-else-if="bannerUrl">
				<img :src="bannerUrl"/>
				<mk-button @click="removeEyeCatchingImage()" v-if="!readonly"><fa :icon="faTrashAlt"/> {{ $t('_channel.removeBanner') }}</mk-button>
			</div>
		</div>
	</div>
	<div class="_footer">
		<mk-button @click="save()"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkTextarea from '../../components/ui/textarea.vue';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import { selectDriveFile } from '../scripts/select-drive-file';

export default Vue.extend({
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
			faSave, faTrashAlt, faPlus,
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
					this.$root.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
				});
			} else {
				this.$root.api('channels/create', params)
				.then(channel => {
					this.$root.dialog({
						type: 'success',
						iconOnly: true, autoClose: true
					});
					this.$router.push(`/channels/${channel.id}`);
				});
			}
		},

		setBannerImage() {
			selectDriveFile(this.$root, false).then(file => {
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
