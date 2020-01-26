<template>
<div class="shaynizk _section">
	<div class="_title">{{ name }}</div>
	<div class="_content">
		<mk-input v-model="name" style="margin-top: 8px;">
			<span>{{ $t('name') }}</span>
		</mk-input>
		<mk-select v-model="src">
			<template #label>{{ $t('antennaSource') }}</template>
			<option value="all">{{ $t('all') }}</option>
			<option value="home">{{ $t('homeTimeline') }}</option>
			<option value="list">{{ $t('userList') }}</option>
		</mk-select>
		<mk-textarea v-model="keywords">
			<span>{{ $t('antennaKeywords') }}</span>
			<template #desc>{{ $t('antennaKeywordsDescription') }}</template>
		</mk-textarea>
		<mk-switch v-model="withFile">{{ $t('withFileAntenna') }}</mk-switch>
		<mk-switch v-model="notify">{{ $t('notifyAntenna') }}</mk-switch>
	</div>
	<div class="_footer">
		<mk-button inline @click="saveAntenna()" primary>{{ $t('save') }}</mk-button>
		<mk-button inline @click="deleteAntenna()" v-if="antenna.id != null">{{ $t('delete') }}</mk-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../i18n';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkSelect from '../../components/ui/select.vue';
import MkSwitch from '../../components/ui/switch.vue';

export default Vue.extend({
	i18n,

	components: {
		MkButton, MkInput, MkTextarea, MkSelect, MkSwitch
	},

	props: {
		antenna: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			name: '',
			src: '',
			keywords: '',
			withFile: false,
			notify: false,
			faTimes
		};
	},

	created() {
		this.name = this.antenna.name;
		this.src = this.antenna.src;
		this.keywords = this.antenna.keywords.map(x => x.join(' ')).join('\n');
		this.withFile = this.antenna.withFile;
		this.notify = this.antenna.notify;
	},

	methods: {
		async saveAntenna() {
			if (this.antenna.id == null) {
				await this.$root.api('antennas/create', {
					name: this.name,
					src: this.src,
					withFile: this.withFile,
					notify: this.notify,
					keywords: this.keywords.trim().split('\n').map(x => x.trim().split(' '))
				});
				this.$emit('created');
			} else {
				await this.$root.api('antennas/update', {
					antennaId: this.antenna.id,
					name: this.name,
					src: this.src,
					withFile: this.withFile,
					notify: this.notify,
					keywords: this.keywords.trim().split('\n').map(x => x.trim().split(' '))
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
				antennaId: this.antenna.id,
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
