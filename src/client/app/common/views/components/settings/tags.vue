<template>
<div class="vfcitkilproprqtbnpoertpsziierwzi">
	<div v-for="timeline in timelines" class="timeline" :key="timeline.id">
		<ui-input v-model="timeline.title" @change="save">
			<span>{{ $t('title') }}</span>
		</ui-input>
		<ui-textarea :value="timeline.query ? timeline.query.map(tags => tags.join(' ')).join('\n') : ''" :pre="true" @input="onQueryChange(timeline, $event)">
			<span>{{ $t('query') }}</span>
		</ui-textarea>
	</div>
	<ui-button class="add" @click="add">{{ $t('add') }}</ui-button>
	<ui-button class="save" @click="save">{{ $t('save') }}</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { v4 as uuid } from 'uuid';

export default Vue.extend({
	i18n: i18n('desktop/views/components/settings.tags.vue'),
	data() {
		return {
			timelines: this.$store.state.settings.tagTimelines
		};
	},

	methods: {
		add() {
			this.timelines.push({
				id: uuid(),
				title: '',
				query: ''
			});
		},

		save() {
			const timelines = this.timelines
				.filter(timeline => timeline.title)
				.map(timeline => {
					if (!(timeline.query && timeline.query[0] && timeline.query[0][0])) {
						timeline.query = timeline.title.split('\n').map(tags => tags.split(' '));
					}
					return timeline;
				});

			this.$store.dispatch('settings/set', { key: 'tagTimelines', value: timelines });
		},

		onQueryChange(timeline, value) {
			timeline.query = value.split('\n').map(tags => tags.split(' '));
		}
	}
});
</script>

<style lang="stylus" scoped>
.vfcitkilproprqtbnpoertpsziierwzi
	> .timeline
		padding-bottom 16px
		border-bottom solid 1px rgba(#000, 0.1)

	> .add
		margin-top 16px

</style>
