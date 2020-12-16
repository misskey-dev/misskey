<template>
<div>
	<MkTab v-model:value="tab">
		<option value="soft">{{ $t('_wordMute.soft') }}</option>
		<option value="hard">{{ $t('_wordMute.hard') }}</option>
	</MkTab>
	<FormBase>
		<div class="_formItem">
			<div v-show="tab === 'soft'">
				<MkInfo>{{ $t('_wordMute.softDescription') }}</MkInfo>
				<FormTextarea v-model:value="softMutedWords">
					<span>{{ $t('_wordMute.muteWords') }}</span>
					<template #desc>{{ $t('_wordMute.muteWordsDescription') }}<br>{{ $t('_wordMute.muteWordsDescription2') }}</template>
				</FormTextarea>
			</div>
			<div v-show="tab === 'hard'">
				<MkInfo>{{ $t('_wordMute.hardDescription') }}</MkInfo>
				<FormTextarea v-model:value="hardMutedWords">
					<span>{{ $t('_wordMute.muteWords') }}</span>
					<template #desc>{{ $t('_wordMute.muteWordsDescription') }}<br>{{ $t('_wordMute.muteWordsDescription2') }}</template>
				</FormTextarea>
				<FormKeyValueView v-if="hardWordMutedNotesCount != null">
					<template #key>{{ $t('_wordMute.mutedNotes') }}</template>
					<template #value>{{ number(hardWordMutedNotesCount) }}</template>
				</FormKeyValueView>
			</div>
		</div>
		<FormButton @click="save()" primary inline :disabled="!changed"><Fa :icon="faSave"/> {{ $t('save') }}</FormButton>
	</FormBase>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCommentSlash, faSave } from '@fortawesome/free-solid-svg-icons';
import FormTextarea from '@/components/form/textarea.vue';
import FormBase from '@/components/form/base.vue';
import FormKeyValueView from '@/components/form/key-value-view.vue';
import FormButton from '@/components/form/button.vue';
import MkTab from '@/components/tab.vue';
import MkInfo from '@/components/ui/info.vue';
import * as os from '@/os';
import number from '@/filters/number';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormTextarea,
		FormKeyValueView,
		MkTab,
		MkInfo,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$t('wordMute'),
				icon: faCommentSlash
			},
			tab: 'soft',
			softMutedWords: '',
			hardMutedWords: '',
			hardWordMutedNotesCount: null,
			changed: false,
			faSave,
		}
	},

	watch: {
		softMutedWords: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
		hardMutedWords: {
			handler() {
				this.changed = true;
			},
			deep: true
		},
	},

	async created() {
		this.softMutedWords = this.$pizzax.state.mutedWords.map(x => x.join(' ')).join('\n');
		this.hardMutedWords = this.$i.mutedWords.map(x => x.join(' ')).join('\n');

		this.hardWordMutedNotesCount = (await os.api('i/get-word-muted-notes-count', {})).count;
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		async save() {
			this.$pizzax.set('mutedWords', this.softMutedWords.trim().split('\n').map(x => x.trim().split(' ')));
			await os.api('i/update', {
				mutedWords: this.hardMutedWords.trim().split('\n').map(x => x.trim().split(' ')),
			});
			this.changed = false;
		},

		number
	}
});
</script>
