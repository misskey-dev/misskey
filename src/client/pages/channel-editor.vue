<template>
<div>
	<portal to="header"><Fa :icon="faSatelliteDish"/>{{ channelId ? $t('_channel.edit') : $t('_channel.create') }}</portal>

	<div class="_section">
		<div class="_content">
			<MkInput v-model:value="name">{{ $t('name') }}</MkInput>

			<MkTextarea v-model:value="description">{{ $t('description') }}</MkTextarea>

			<div class="banner">
				<MkButton v-if="bannerId == null" @click="setBannerImage"><Fa :icon="faPlus"/> {{ $t('_channel.setBanner') }}</MkButton>
				<div v-else-if="bannerUrl">
					<img :src="bannerUrl" style="width: 100%;"/>
					<MkButton @click="removeBannerImage()"><Fa :icon="faTrashAlt"/> {{ $t('_channel.removeBanner') }}</MkButton>
				</div>
			</div>
		</div>
		<div class="_footer">
			<MkButton @click="save()" primary><Fa :icon="faSave"/> {{ channelId ? $t('save') : $t('create') }}</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faSatelliteDish } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkTextarea from '@/components/ui/textarea.vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';

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
				this.bannerUrl = (await os.api('drive/files/show', {
					fileId: this.bannerId,
				})).url;
			}
		},
	},

	async created() {
		if (this.channelId) {
			this.channel = await os.api('channels/show', {
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
				os.api('channels/update', params)
				.then(channel => {
					os.success();
				});
			} else {
				os.api('channels/create', params)
				.then(channel => {
					os.success();
					this.$router.push(`/channels/${channel.id}`);
				});
			}
		},

		setBannerImage(e) {
			selectFile(e.currentTarget || e.target, null, false).then(file => {
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
