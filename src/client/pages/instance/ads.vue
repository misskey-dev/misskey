<template>
<div class="uqshojas">
	<MkButton @click="add()" primary style="margin: 0 auto 16px auto;"><i class="fas fa-plus"></i> {{ $ts.add }}</MkButton>
	<section class="_card _gap announcements" v-for="announcement in announcements">
		<div class="_content announcement">
			<MkInput v-model:value="announcement.title">
				<span>{{ $ts.title }}</span>
			</MkInput>
			<MkTextarea v-model:value="announcement.text">
				<span>{{ $ts.text }}</span>
			</MkTextarea>
			<MkInput v-model:value="announcement.imageUrl">
				<span>{{ $ts.imageUrl }}</span>
			</MkInput>
			<p v-if="announcement.reads">{{ $t('nUsersRead', { n: announcement.reads }) }}</p>
			<div class="buttons">
				<MkButton class="button" inline @click="save(announcement)" primary><i class="fas fa-save"></i> {{ $ts.save }}</MkButton>
				<MkButton class="button" inline @click="remove(announcement)"><i class="fas fa-trash-alt"></i> {{ $ts.remove }}</MkButton>
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
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkTextarea,
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
		
	}
});
</script>

<style lang="scss" scoped>
.uqshojas {
	margin: var(--margin);
}
</style>
