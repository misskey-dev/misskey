<template>
<div class="mkw-hashtags">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header">%fa:hashtag%%i18n:@title%</template>

		<div class="mkw-hashtags--body" :data-mobile="platform == 'mobile'">
			<mk-trends/>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';

export default define({
	name: 'hashtags',
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
