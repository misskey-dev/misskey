<template>
<p>ver {{ v }} (葵 aoi)</p>
</template>

<script lang="ts">
import { version } from '../../../config';
import define from '../../../common/define-widget';
export default define({
	name: 'version'
}).extend({
	data() {
		return {
			v: version
		};
	}
});
</script>

<style lang="stylus" scoped>
p
	display block
	margin 0
	padding 0 12px
	text-align center
	font-size 0.7em
	color #aaa

</style>
