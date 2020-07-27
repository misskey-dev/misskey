<template>
<section class="_card">
	<div class="_title"><fa :icon="faCommentSlash"/> {{ $t('wordMute') }}</div>
	<div class="_content">
		<mk-textarea v-model="mutedWords">
			<span>{{ $t('muteWords') }}</span>
			<template #desc>{{ $t('muteWordsDescription') }}</template>
		</mk-textarea>
	</div>
	<div class="_footer">
		<mk-button @click="save()" primary inline :disabled="!changed"><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faCommentSlash, faSave } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkTextarea from '../../components/ui/textarea.vue';

export default Vue.extend({
	components: {
		MkButton,
		MkTextarea,
	},
	
	data() {
		return {
			mutedWords: '',
			changed: false,
			faCommentSlash, faSave,
		}
	},

	watch: {
		mutedWords() {
			this.changed = true;
		},
	},

	created() {
		this.mutedWords = this.$store.state.i.mutedWords.map(x => x.join(' ')).join('\n');
	},

	methods: {
		async save() {
			await this.$root.api('i/update', {
				mutedWords: this.mutedWords.trim().split('\n').map(x => x.trim().split(' ')),
			});
			this.changed = false;
		},
	}
});
</script>
