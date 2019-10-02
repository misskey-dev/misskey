<template>
<mk-ui :fabClickedAction="add" fabIcon="plus">
	<template #header><span style="margin-right:4px;"><fa icon="home"/></span>{{ $t('dashboard') }}</template>
	<template #func>
		<button @click="customizing = !customizing"><fa icon="cog"/></button>
	</template>
	<main>
		<template v-if="customizing">
			<header>
				<select v-model="widgetAdderSelected">
					<option v-for="widget in widgetsList" :key="widget" :value="widget.type">{{ $t(widget.text) }}</option>
				</select>
				<button @click="addWidget">{{ $t('add-widget') }}</button>
				<p><a @click="hint">{{ $t('customization-tips') }}</a></p>
			</header>
			<x-draggable
				:list="widgets"
				handle=".handle"
				animation="150"
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
import { v4 as uuid } from 'uuid';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/widgets.vue'),
	components: {
		XDraggable
	},

	data() {
		return {
			showNav: false,
			customizing: false,
			widgetAdderSelected: null,
			widgetsList: [
				{ type: 'profile', text: '@.widgets.profile' },
				{ type: 'analog-clock', text: '@.widgets.analog-clock' },
				{ type: 'calendar', text: '@.widgets.calendar' },
				{ type: 'activity', text: '@.widgets.activity' },
				{ type: 'rss', text: '@.widgets.rss' },
				{ type: 'html', text: '@.widgets.html' },
				{ type: 'photo-stream', text: '@.widgets.photo-stream' },
				{ type: 'slideshow', text: '@.widgets.slideshow' },
				{ type: 'hashtags', text: '@.widgets.hashtags' },
				{ type: 'posts-monitor', text: '@.widgets.posts-monitor' },
				{ type: 'version', text: '@.widgets.version' },
				{ type: 'server', text: '@.widgets.server' },
				{ type: 'queue', text: '@.widgets.queue' },
				{ type: 'memo', text: '@.widgets.memo' },
				{ type: 'nav', text: '@.widgets.nav' },
				{ type: 'tips', text: '@.widgets.tips' },
			],
		};
	},

	computed: {
		widgets(): any[] {
			return this.$store.getters.mobileHome || [];
		}
	},

	created() {
		if (this.widgets.length == 0) {
			this.$store.commit('setMobileHome', [{
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
			}]);
		}
	},

	mounted() {
		document.title = this.$root.instanceName;
	},

	methods: {
		hint() {
			this.$root.dialog({
				type: 'info',
				text: this.$t('widgets-hints')
			});
		},

		widgetFunc(id) {
			const w = this.$refs[id][0];
			if (w.func) w.func();
		},

		onWidgetSort() {
			this.saveHome();
		},

		addWidget() {
			if(this.widgetAdderSelected == null) return;
			this.addWidgetOf(this.widgetAdderSelected);
		},

		addWidgetOf(widgetType) {
			this.$store.commit('addMobileHomeWidget', {
				name: widgetType,
				id: uuid(),
				data: {}
			});
		},

		removeWidget(widget) {
			this.$store.commit('removeMobileHomeWidget', widget);
		},

		saveHome() {
			this.$store.commit('setMobileHome', this.widgets);
		},

		add() {
			this.$root.dialog({
				title: this.$t('@.customize-home'),
				type: null,
				select: {
					items: this.widgetsList.map(x => ({
						value: x.type, text: this.$t(x.text)
					}))
					default: this.type,
				},
				showCancelButton: true
			}).then(({ canceled, result: type }) => {
				if (canceled) return;
				this.addWidgetOf(type);
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
