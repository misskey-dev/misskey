<template>
<div class="anltbovirfeutcigvwgmgxipejaeozxi">
	<ui-container :show-header="!props.compact">
		<template #header><fa :icon="faBroadcastTower"/>{{ $t('title') }}</template>
		<template #func>
			<button v-if="announcements.length > 1" @click="next">
				<fa v-if="i == announcements.length - 1" :icon="faUndo"/>
				<fa v-else :icon="faArrowRight"/>
			</button>
		</template>
		<div class="anltbovirfeutcigvwgmgxipejaeozxi-body">
			<p class="fetching" v-if="fetching">{{ $t('fetching') }}<mk-ellipsis/></p>
			<h1 v-if="!fetching">{{ announcements.length == 0 ? $t('no-broadcasts') : announcements[i].title }}</h1>
			<p v-if="!fetching">
				<mfm v-if="announcements.length != 0" :text="announcements[i].text" :key="i"/>
				<img v-if="announcements.length != 0 && announcements[i].image" :src="announcements[i].image" alt="" style="display: block; max-height: 130px; max-width: 100%;"/>
				<template v-if="announcements.length == 0">{{ $t('have-a-nice-day') }}</template>
			</p>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';
import { faBroadcastTower, faUndo, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default define({
	name: 'broadcast',
}).extend({
	i18n: i18n('common/views/widgets/broadcast.vue'),
	data() {
		return {
			i: 0,
			fetching: true,
			announcements: [],
			faBroadcastTower, faUndo, faArrowRight
		};
	},
	mounted() {
		this.$root.getMeta().then(meta => {
			this.announcements = meta.announcements;
			this.fetching = false;
		});
	},
	methods: {
		next() {
			if (this.i == this.announcements.length - 1) {
				this.i = 0;
			} else {
				this.i++;
			}
		},
	}
});
</script>

<style lang="stylus" scoped>
.anltbovirfeutcigvwgmgxipejaeozxi-body
	padding 10px

	> h1
		margin 0
		font-size 1em
		font-weight normal
		color var(--text)

	> p
		display block
		z-index 1
		margin 0
		font-size 0.8em
		color var(--text)

		&.fetching
			text-align center
</style>
