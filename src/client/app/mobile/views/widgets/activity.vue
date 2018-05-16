<template>
<div class="mkw-activity">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header">%fa:chart-bar%アクティビティ</template>
		<div :class="$style.body">
			<mk-activity :user="os.i"/>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';

export default define({
	name: 'activity',
	props: () => ({
		compact: false
	})
}).extend({
	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		}
	}
});
</script>

<style lang="stylus" module>
.body
	padding 8px
</style>
