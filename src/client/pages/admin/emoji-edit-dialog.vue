<template>
<XModalWindow ref="dialog"
	:width="370"
	:with-ok-button="true"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
	@ok="ok()"
>
	<template #header>:{{ emoji.name }}:</template>

	<div class="_monolithic_">
		<div class="yigymqpb _section">
			<img :src="emoji.url" class="img"/>
			<MkInput class="_formBlock" v-model="name">
				<template #label>{{ $ts.name }}</template>
			</MkInput>
			<MkInput class="_formBlock" v-model="category" :datalist="categories">
				<template #label>{{ $ts.category }}</template>
			</MkInput>
			<MkInput class="_formBlock" v-model="aliases">
				<template #label>{{ $ts.tags }}</template>
				<template #caption>{{ $ts.setMultipleBySeparatingWithSpace }}</template>
			</MkInput>
			<MkButton danger @click="del()"><i class="fas fa-trash-alt"></i> {{ $ts.delete }}</MkButton>
		</div>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XModalWindow from '@client/components/ui/modal-window.vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/form/input.vue';
import * as os from '@client/os';
import { unique } from '../../../prelude/array';

export default defineComponent({
	components: {
		XModalWindow,
		MkButton,
		MkInput,
	},

	props: {
		emoji: {
			required: true,
		}
	},

	emits: ['done', 'closed'],

	data() {
		return {
			name: this.emoji.name,
			category: this.emoji.category,
			aliases: this.emoji.aliases?.join(' '),
			categories: [],
		}
	},

	created() {
		os.api('meta', { detail: false }).then(({ emojis }) => {
			this.categories = unique(emojis.map((x: any) => x.category || '').filter((x: string) => x !== ''));
		});
	},

	methods: {
		ok() {
			this.update();
		},

		async update() {
			await os.apiWithDialog('admin/emoji/update', {
				id: this.emoji.id,
				name: this.name,
				category: this.category,
				aliases: this.aliases.split(' '),
			});

			this.$emit('done', {
				updated: {
					name: this.name,
					category: this.category,
					aliases: this.aliases.split(' '),
				}
			});
			this.$refs.dialog.close();
		},

		async del() {
			const { canceled } = await os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.emoji.name }),
				showCancelButton: true
			});
			if (canceled) return;

			os.api('admin/emoji/remove', {
				id: this.emoji.id
			}).then(() => {
				this.$emit('done', {
					deleted: true
				});
				this.$refs.dialog.close();
			});
		},
	}
});
</script>

<style lang="scss" scoped>
.yigymqpb {
	> .img {
		display: block;
		height: 64px;
		margin: 0 auto;
	}
}
</style>
