<template>
<XWindow @close="$emit('done')" :width="370" :with-ok-button="true">
	<template #header>{{ emoji.name }}</template>

	<MkInput v-model:value="name"><span>{{ $t('name') }}</span></MkInput>
	<MkInput v-model:value="category" :datalist="categories"><span>{{ $t('category') }}</span></MkInput>
	<MkInput v-model:value="aliases"><span>{{ $t('tags') }}</span></MkInput>
	<MkButton inline @click="del()"><Fa :icon="faTrashAlt"/> {{ $t('delete') }}</MkButton>
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
			aliases: this.emoji.aliases,
			faTrashAlt,
		}
	},

	computed: {
		categories() {
			if (this.$store.state.instance.meta) {
				return unique(this.$store.state.instance.meta.emojis.map((x: any) => x.category || '').filter((x: string) => x !== ''));
			} else {
				return [];
			}
		}
	},

	methods: {
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

			this.$emit('done');
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
				this.$emit('done');
			});
		},
	}
});
</script>
