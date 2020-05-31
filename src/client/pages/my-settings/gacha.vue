<template>
<section class="_card">
	<div class="_title"><fa :icon="faFish"/> {{ $t('gachaSettings') }}</div>
	<div class="_content">
		<mk-textarea v-model="faces">{{ $t('gachaFaces') }}<template #desc>{{ $t('gachaSettingDescription') }}</template></mk-textarea>
	</div>
	<div class="_footer">
		<mk-button @click="save()" primary inline :disabled="!changed"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faFish } from '@fortawesome/free-solid-svg-icons';
import { faSave } from '@fortawesome/free-regular-svg-icons';
import MkTextarea from '../../components/ui/textarea.vue';
import MkButton from '../../components/ui/button.vue';

export default Vue.extend({
	components: {
		MkTextarea,
		MkButton,
	},
	
	data() {
		return {
			faces: this.$store.state.settings.faces.join('\n'),
			changed: false,
			faFish, faSave
		}
	},
	watch: {
		faces() {
			this.changed = true;
		}
	},
	methods: {
		save() {
			this.$store.dispatch('settings/set', { key: 'faces', value: this.faces.trim().split('\n') });
			this.changed = false;
		},
	}
});
</script>
