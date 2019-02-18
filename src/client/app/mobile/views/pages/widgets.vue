<template>
<mk-ui>
	<template #header><span style="margin-right:4px;"><fa icon="home"/></span>{{ $t('dashboard') }}</template>
	<template #func>
		<button @click="customizing = !customizing"><fa icon="cog"/></button>
	</template>
	<main>
		<template v-if="customizing">
			<header>
				<select v-model="widgetAdderSelected">
					<option value="profile">{{ $t('@.widgets.profile') }}</option>
					<option value="analog-clock">{{ $t('@.widgets.analog-clock') }}</option>
					<option value="calendar">{{ $t('@.widgets.calendar') }}</option>
					<option value="activity">{{ $t('@.widgets.activity') }}</option>
					<option value="rss">{{ $t('@.widgets.rss') }}</option>
					<option value="photo-stream">{{ $t('@.widgets.photo-stream') }}</option>
					<option value="slideshow">{{ $t('@.widgets.slideshow') }}</option>
					<option value="hashtags">{{ $t('@.widgets.hashtags') }}</option>
					<option value="posts-monitor">{{ $t('@.widgets.posts-monitor') }}</option>
					<option value="version">{{ $t('@.widgets.version') }}</option>
					<option value="server">{{ $t('@.widgets.server') }}</option>
					<option value="memo">{{ $t('@.widgets.memo') }}</option>
					<option value="nav">{{ $t('@.widgets.nav') }}</option>
					<option value="tips">{{ $t('@.widgets.tips') }}</option>
				</select>
				<button @click="addWidget">{{ $t('add-widget') }}</button>
				<p><a @click="hint">{{ $t('customization-tips') }}</a></p>
			</header>
			<x-draggable
				:list="widgets"
				:options="{ handle: '.handle', animation: 150 }"
				@sort="onWidgetSort"
			>
				<div v-for="widget in widgets" class="customize-container" :key="widget.id">
					<header>
						<span class="handle"><fa icon="bars"/></span>{{ widget.name }}<button class="remove" @click="removeWidget(widget)"><fa icon="times"/></button>
					</header>
					<div @click="widgetFunc(widget.id)">
						<component :is="`mkw-${widget.name}`" :widget="widget" :ref="widget.id" :is-customize-mode="true" platform="mobile"/>
					</div>
				</div>
			</x-draggable>
		</template>
		<template v-else>
			<component class="widget" v-for="widget in widgets" :is="`mkw-${widget.name}`" :key="widget.id" :ref="widget.id" :widget="widget" platform="mobile"/>
		</template>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import * as XDraggable from 'vuedraggable';
import * as uuid from 'uuid';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/widgets.vue'),
	components: {
		XDraggable
	},

	data() {
		return {
			showNav: false,
			customizing: false,
			widgetAdderSelected: null
		};
	},

	computed: {
		widgets(): any[] {
			return this.$store.state.settings.mobileHome;
		}
	},

	created() {
		if (this.widgets.length == 0) {
			this.widgets = [{
				name: 'calendar',
				id: 'a', data: {}
			}, {
				name: 'activity',
				id: 'b', data: {}
			}, {
				name: 'rss',
				id: 'c', data: {}
			}, {
				name: 'photo-stream',
				id: 'd', data: {}
			}, {
				name: 'nav',
				id: 'f', data: {}
			}, {
				name: 'version',
				id: 'g', data: {}
			}];
			this.saveHome();
		}
	},

	mounted() {
		document.title = this.$root.instanceName;
	},

	methods: {
		hint() {
			alert(this.$t('widgets-hints'));
		},

		widgetFunc(id) {
			const w = this.$refs[id][0];
			if (w.func) w.func();
		},

		onWidgetSort() {
			this.saveHome();
		},

		addWidget() {
			this.$store.dispatch('settings/addMobileHomeWidget', {
				name: this.widgetAdderSelected,
				id: uuid(),
				data: {}
			});
		},

		removeWidget(widget) {
			this.$store.dispatch('settings/removeMobileHomeWidget', widget);
		},

		saveHome() {
			this.$store.commit('settings/setMobileHome', this.widgets);
			this.$root.api('i/update_mobile_home', {
				home: this.widgets
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	margin 0 auto
	padding 8px
	max-width 500px
	width 100%

	@media (min-width 500px)
		padding 16px 8px

	@media (min-width 600px)
		padding 32px 8px

	> header
		padding 8px
		background #fff

	.widget
		margin-bottom 8px

		@media (min-width 600px)
			margin-bottom 16px

	.customize-container
		margin 8px
		background #fff

		> header
			line-height 32px
			background #eee

			> .handle
				padding 0 8px

			> .remove
				position absolute
				top 0
				right 0
				padding 0 8px
				line-height 32px

		> div
			padding 8px

			> *
				pointer-events none

</style>
