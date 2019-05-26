<template>
<div class="ecsvsegy" v-if="!fetching">
	<sequential-entrance animation="entranceFromTop" delay="25">
		<template v-for="note in notes">
			<mk-note-detail class="post" :note="note" :key="note.id"/>
		</template>
	</sequential-entrance>
	<div class="more" v-if="more">
		<ui-button inline @click="fetchMore()">{{ $t('@.load-more') }}</ui-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import paging from '../../../common/scripts/paging';

export default Vue.extend({
	i18n: i18n(),

	mixins: [
		paging({
			captureWindowScroll: true,
		}),
	],

	props: {
		pagination: {
			required: true
		},
		extract: {
			required: false
		}
	},

	computed: {
		notes() {
			return this.extract ? this.extract(this.items) : this.items;
		}
	}
});
</script>

<style lang="stylus" scoped>
.ecsvsegy
	margin 0 auto

	> * > .post
		margin-bottom 16px

	> .more
		margin 32px 16px 16px 16px
		text-align center

</style>
