<template>
<div class="ztgjmzrw">
	<MkButton @click="add()" primary style="margin: 0 auto 16px auto;"><i class="fas fa-plus"></i> {{ $ts.add }}</MkButton>
	<section class="_card _gap announcements" v-for="announcement in announcements">
		<div class="_content announcement">
			<MkInput v-model="announcement.title">
				<template #label>{{ $ts.title }}</template>
			</MkInput>
			<MkTextarea v-model="announcement.text">
				<template #label>{{ $ts.text }}</template>
			</MkTextarea>
			<MkInput v-model="announcement.imageUrl">
				<template #label>{{ $ts.imageUrl }}</template>
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
				title: this.$ts.announcements,
				icon: 'fas fa-broadcast-tower'
			},
			announcements: [],
		}
	},

	created() {
		os.api('admin/announcements/list').then(announcements => {
			this.announcements = announcements;
		});
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		add() {
			this.announcements.unshift({
				id: null,
				title: '',
				text: '',
				imageUrl: null
			});
		},

		remove(announcement) {
			os.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: announcement.title }),
				showCancelButton: true
			}).then(({ canceled }) => {
				if (canceled) return;
				this.announcements = this.announcements.filter(x => x != announcement);
				os.api('admin/announcements/delete', announcement);
			});
		},

		save(announcement) {
			if (announcement.id == null) {
				os.api('admin/announcements/create', announcement).then(() => {
					os.dialog({
						type: 'success',
						text: this.$ts.saved
					});
				}).catch(e => {
					os.dialog({
						type: 'error',
						text: e
					});
				});
			} else {
				os.api('admin/announcements/update', announcement).then(() => {
					os.dialog({
						type: 'success',
						text: this.$ts.saved
					});
				}).catch(e => {
					os.dialog({
						type: 'error',
						text: e
					});
				});
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.ztgjmzrw {
	margin: var(--margin);
}
</style>
