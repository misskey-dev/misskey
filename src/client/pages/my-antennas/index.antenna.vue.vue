<template>
<div class="shaynizk _section">
	<div class="_title">{{ antenna.name }}</div>
	<div class="_content">
		<mk-input v-model="announcement.title" style="margin-top: 8px;">
			<span>{{ $t('name') }}</span>
		</mk-input>
		<mk-textarea v-model="announcement.text">
			<span>{{ $t('text') }}</span>
		</mk-textarea>
	</div>
	<div class="_footer">
		<mk-button inline @click="saveAntenna()">{{ $t('save') }}</mk-button>
		<mk-button inline @click="deleteAntenna()" v-if="antenna.id != null">{{ $t('delete') }}</mk-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../i18n';
import MkButton from '../../components/ui/button.vue';

export default Vue.extend({
	i18n,

	components: {
		MkButton
	},

	props: {
		antenna: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			faTimes
		};
	},

	methods: {
		async saveAntenna() {
			if (this.antenna.id == null) {
				await this.$root.api('antennas/create', {
					name: name
				});
				this.$emit('created');
			} else {
				await this.$root.api('antennas/update', {
					antennaId: this.$route.params.antenna,
					name: name
				});
			}

			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
		},

		async deleteAntenna() {
			const { canceled } = await this.$root.dialog({
				type: 'warning',
				text: this.$t('removeAreYouSure', { x: this.antenna.name }),
				showCancelButton: true
			});
			if (canceled) return;

			await this.$root.api('antennas/delete', {
				antennaId: this.$route.params.antenna
			});

			this.$root.dialog({
				type: 'success',
				iconOnly: true, autoClose: true
			});
			this.$emit('deleted');
		}
	}
});
</script>

<style lang="scss" scoped>
.shaynizk {
}
</style>
