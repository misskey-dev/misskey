<template>
<div class="uqshojas">
	<MkButton @click="add()" primary style="margin: 0 auto 16px auto;"><i class="fas fa-plus"></i> {{ $ts.add }}</MkButton>
	<section class="_card _gap ads" v-for="ad in ads">
		<div class="_content ad">
			<MkAd v-if="ad.url" :specify="ad"/>
			<MkInput v-model:value="ad.url" type="url">
				<span>URL</span>
			</MkInput>
			<MkInput v-model:value="ad.imageUrl">
				<span>{{ $ts.imageUrl }}</span>
			</MkInput>
			<div style="margin: 32px 0;">
				<MkRadio v-model="ad.place" value="square">square</MkRadio>
				<MkRadio v-model="ad.place" value="horizontal">horizontal</MkRadio>
				<MkRadio v-model="ad.place" value="horizontal-big">horizontal-big</MkRadio>
			</div>
			<div style="margin: 32px 0;">
				{{ $ts.priority }}
				<MkRadio v-model="ad.priority" value="high">{{ $ts.high }}</MkRadio>
				<MkRadio v-model="ad.priority" value="middle">{{ $ts.middle }}</MkRadio>
				<MkRadio v-model="ad.priority" value="low">{{ $ts.low }}</MkRadio>
			</div>
			<MkInput v-model:value="ad.expiresAt" type="date">
				<span>{{ $ts.expiration }}</span>
			</MkInput>
			<MkTextarea v-model:value="ad.memo">
				<span>{{ $ts.memo }}</span>
			</MkTextarea>
			<div class="buttons">
				<MkButton class="button" inline @click="save(ad)" primary><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
				<MkButton class="button" inline @click="remove(ad)" danger><i class="fas fa-trash-alt"></i> {{ $ts.remove }}</MkButton>
			</div>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkTextarea from '@client/components/ui/textarea.vue';
import MkRadio from '@client/components/ui/radio.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkTextarea,
		MkRadio,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.ads,
				icon: 'fas fa-audio-description'
			},
			ads: [],
		}
	},

	created() {
		os.api('admin/ad/list').then(ads => {
			this.ads = ads;
		});
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		add() {
			this.ads.unshift({
				id: null,
				memo: '',
				place: 'square',
				priority: 'middle',
				url: '',
				imageUrl: null,
				expiresAt: null,
			});
		},

		remove(ad) {
			os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: ad.url }),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.ads = this.ads.filter(x => x != ad);
				os.apiWithDialog('admin/ad/delete', {
					id: ad.id
				});
			});
		},

		save(ad) {
			if (ad.id == null) {
				os.apiWithDialog('admin/ad/create', {
					...ad,
					expiresAt: new Date(ad.expiresAt).getTime()
				});
			} else {
				os.apiWithDialog('admin/ad/update', {
					...ad,
					expiresAt: new Date(ad.expiresAt).getTime()
				});
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.uqshojas {
	margin: var(--margin);
}
</style>
