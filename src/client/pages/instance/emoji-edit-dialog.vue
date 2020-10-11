<template>
<XWindow @close="$emit('done')" :width="370" :with-ok-button="true" @ok="ok()">
	<template #header>{{ emoji.name }}</template>

	<div class="yigymqpb">
		<img :src="emoji.url" class="img"/>
		<MkInput v-model:value="name"><span>{{ $t('name') }}</span></MkInput>
		<MkInput v-model:value="category" :datalist="categories"><span>{{ $t('category') }}</span></MkInput>
		<MkInput v-model:value="aliases">
			<span>{{ $t('tags') }}</span>
			<template #desc>{{ $t('setMultipleBySeparatingWithSpace') }}</template>
		</MkInput>
		<MkButton inline @click="del()"><Fa :icon="faTrashAlt"/> {{ $t('delete') }}</MkButton>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import XWindow from '@/components/window.vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';
import { unique } from '../../../prelude/array';

export default defineComponent({
	components: {
		XWindow,
		MkButton,
		MkInput,
	},

	props: {
		emoji: {
			required: true,
		}
	},

	emits: ['done'],

	data() {
		return {
			name: this.emoji.name,
			category: this.emoji.category,
			aliases: this.emoji.aliases?.join(' '),
			categories: [],
			faTrashAlt,
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
			await os.api('admin/emoji/update', {
				id: this.emoji.id,
				name: this.name,
				category: this.category,
				aliases: this.aliases.split(' '),
			});

			os.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});

			this.$emit('done', {
				updated: {
					name: this.name,
					category: this.category,
					aliases: this.aliases.split(' '),
				}
			});
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
