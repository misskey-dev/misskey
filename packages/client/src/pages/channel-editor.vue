<template>
<div>
	<div class="_section">
		<div class="_content">
			<MkInput v-model="name">
				<template #label>{{ $ts.name }}</template>
			</MkInput>

			<MkTextarea v-model="description">
				<template #label>{{ $ts.description }}</template>
			</MkTextarea>

			<div class="banner">
				<MkButton v-if="bannerId == null" @click="setBannerImage"><i class="fas fa-plus"></i> {{ $ts._channel.setBanner }}</MkButton>
				<div v-else-if="bannerUrl">
					<img :src="bannerUrl" style="width: 100%;"/>
					<MkButton @click="removeBannerImage()"><i class="fas fa-trash-alt"></i> {{ $ts._channel.removeBanner }}</MkButton>
				</div>
			</div>
		</div>
		<div class="_footer">
			<MkButton primary @click="save()"><i class="fas fa-save"></i> {{ channelId ? $ts.save : $ts.create }}</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import * as symbols from '@/symbols';

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
			[symbols.PAGE_INFO]: computed(() => this.channelId ? {
				title: this.$ts._channel.edit,
				icon: 'fas fa-satellite-dish',
			} : {
				title: this.$ts._channel.create,
				icon: 'fas fa-satellite-dish',
			}),
			channel: null,
			name: null,
			description: null,
			bannerUrl: null,
			bannerId: null,
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
