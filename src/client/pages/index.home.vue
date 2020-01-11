<template>
<div class="mk-home">
	<portal to="title"><span>pope<button @click="choose()">a</button></span></portal>
	<x-home-timeline @before="before()" @after="after()"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../scripts/loading';
import XHomeTimeline from './index.home.timeline.vue';

export default Vue.extend({
	metaInfo() {
		return {
			title: this.$t('timeline')
		};
	},
	components: {
		XHomeTimeline
	},
	methods: {
		before() {
			Progress.start();
		},
		after() {
			Progress.done();
		},
		choose() {
			alert('a');
		}
	}
});
</script>
