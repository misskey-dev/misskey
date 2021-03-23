<template>
<XModalWindow ref="dialog"
	:width="370"
	:with-ok-button="true"
	@close="$refs.dialog.close()"
	@closed="$emit('closed')"
	@ok="ok()"
>
	<template #header>:{{ emoji.name }}:</template>

	<div class="yigymqpb _section">
		<img :src="emoji.url" class="img"/>
		<MkInput v-model:value="name"><span>{{ $ts.name }}</span></MkInput>
		<MkInput v-model:value="category" :datalist="categories"><span>{{ $ts.category }}</span></MkInput>
		<MkInput v-model:value="aliases">
			<span>{{ $ts.tags }}</span>
			<template #desc>{{ $ts.setMultipleBySeparatingWithSpace }}</template>
		</MkInput>
		<MkButton danger @click="del()"><Fa :icon="faTrashAlt"/> {{ $ts.delete }}</MkButton>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import XModalWindow from '@client/components/ui/modal-window.vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
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
