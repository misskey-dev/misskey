<template>
<div class="ztgjmzrw">
	<div class="_section">
		<div class="_content">
			<MkButton @click="add()" primary style="margin: 0 auto 16px auto;"><Fa :icon="faPlus"/> {{ $ts.add }}</MkButton>
			<section class="_card _vMargin announcements" v-for="announcement in announcements">
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
						<MkButton class="button" inline @click="save(announcement)" primary><Fa :icon="faSave"/> {{ $ts.save }}</MkButton>
						<MkButton class="button" inline @click="remove(announcement)"><Fa :icon="faTrashAlt"/> {{ $ts.remove }}</MkButton>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBroadcastTower, faPlus } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import MkTextarea from '@client/components/ui/textarea.vue';
import * as os from '@client/os';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
		MkTextarea,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.announcements,
				icon: faBroadcastTower
			},
			announcements: [],
			faBroadcastTower, faSave, faTrashAlt, faPlus
		}
	},

	created() {
		os.api('admin/announcements/list').then(announcements => {
			this.announcements = announcements;
		});
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
