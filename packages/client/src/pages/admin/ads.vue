<template>
<MkSpacer :content-max="900">
	<div class="uqshojas">
		<div v-for="ad in ads" class="_panel _formRoot ad">
			<MkAd v-if="ad.url" :specify="ad"/>
			<MkInput v-model="ad.url" type="url" class="_formBlock">
				<template #label>URL</template>
			</MkInput>
			<MkInput v-model="ad.imageUrl" class="_formBlock">
				<template #label>{{ $ts.imageUrl }}</template>
			</MkInput>
			<FormRadios v-model="ad.place" class="_formBlock">
				<template #label>Form</template>
				<option value="square">square</option>
				<option value="horizontal">horizontal</option>
				<option value="horizontal-big">horizontal-big</option>
			</FormRadios>
			<!--
			<div style="margin: 32px 0;">
				{{ $ts.priority }}
				<MkRadio v-model="ad.priority" value="high">{{ $ts.high }}</MkRadio>
				<MkRadio v-model="ad.priority" value="middle">{{ $ts.middle }}</MkRadio>
				<MkRadio v-model="ad.priority" value="low">{{ $ts.low }}</MkRadio>
			</div>
			-->
			<div class="_inputSplit">
				<MkInput v-model="ad.ratio" type="number">
					<template #label>{{ $ts.ratio }}</template>
				</MkInput>
				<MkInput v-model="ad.expiresAt" type="date">
					<template #label>{{ $ts.expiration }}</template>
				</MkInput>
			</div>
			<MkTextarea v-model="ad.memo" class="_formBlock">
				<template #label>{{ $ts.memo }}</template>
			</MkTextarea>
			<div class="buttons _formBlock">
				<MkButton class="button" inline primary style="margin-right: 12px;" @click="save(ad)"><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
				<MkButton class="button" inline danger @click="remove(ad)"><i class="fas fa-trash-alt"></i> {{ $ts.remove }}</MkButton>
			</div>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import MkTextarea from '@/components/form/textarea.vue';
import FormRadios from '@/components/form/radios.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkTextarea,
		FormRadios,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.ads,
				icon: 'fas fa-audio-description',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-plus',
					text: this.$ts.add,
					handler: this.add,
				}],
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
				ratio: 1,
				url: '',
				imageUrl: null,
				expiresAt: null,
			});
		},

		remove(ad) {
			os.confirm({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: ad.url }),
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
	> .ad {
		padding: 32px;

		&:not(:last-child) {
			margin-bottom: var(--margin);
		}
	}
}
</style>
