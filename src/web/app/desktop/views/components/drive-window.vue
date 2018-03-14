<template>
<mk-window ref="window" @closed="$destroy" width="800px" height="500px" :popout-url="popout">
	<template slot="header">
		<p v-if="usage" :class="$style.info"><b>{{ usage.toFixed(1) }}%</b> %i18n:desktop.tags.mk-drive-browser-window.used%</p>
		<span :class="$style.title">%fa:cloud%%i18n:desktop.tags.mk-drive-browser-window.drive%</span>
	</template>
	<mk-drive :class="$style.browser" multiple :init-folder="folder" ref="browser"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import { url } from '../../../config';

export default Vue.extend({
	props: ['folder'],
	data() {
		return {
			usage: null
		};
	},
	mounted() {
		(this as any).api('drive').then(info => {
			this.usage = info.usage / info.capacity * 100;
		});
	},
	methods: {
		popout() {
			const folder = (this.$refs.browser as any) ? (this.$refs.browser as any).folder : null;
			if (folder) {
				return `${url}/i/drive/folder/${folder.id}`;
			} else {
				return `${url}/i/drive`;
			}
		}
	}
});
</script>

<style lang="stylus" module>
.title
	> [data-fa]
		margin-right 4px

.info
	position absolute
	top 0
	left 16px
	margin 0
	font-size 80%

.browser
	height 100%

</style>

