<template>
<div>
	<ui-container v-if="user.pinnedNotes && user.pinnedNotes.length > 0" :body-togglable="true">
		<span slot="header"><fa icon="thumbtack"/> {{ $t('pinned-notes') }}</span>
		<div>
			<x-note v-for="n in user.pinnedNotes" :key="n.id" :note="n" :mini="true"/>
		</div>
	</ui-container>
	<ui-container v-if="images.length > 0" :body-togglable="true">
		<span slot="header"><fa :icon="['far', 'images']"/> {{ $t('images') }}</span>
		<div class="sainvnaq">
			<router-link v-for="image in images"
				:style="`background-image: url(${image.thumbnailUrl})`"
				:key="`${image.id}:${image._note.id}`"
				:to="image._note | notePage"
				:title="`${image.name}\n${(new Date(image.createdAt)).toLocaleString()}`"
			></router-link>
		</div>
	</ui-container>
	<ui-container :body-togglable="true">
		<span slot="header"><fa :icon="['far', 'chart-bar']"/> {{ $t('activity') }}</span>
		<div>
			<div ref="chart"></div>
		</div>
	</ui-container>
	<ui-container>
		<span slot="header"><fa :icon="['far', 'comment-alt']"/> {{ $t('timeline') }}</span>
		<div>
			<x-notes ref="timeline" :more="existMore ? fetchMoreNotes : null"/>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import parseAcct from '../../../../../misc/acct/parse';
import XNotes from './deck.notes.vue';
import XNote from '../components/note.vue';
import { concat } from '../../../../../prelude/array';
import ApexCharts from 'apexcharts';

const fetchLimit = 10;

export default Vue.extend({
	i18n: i18n('deck/deck.user-column.vue'),
	components: {
		XNotes,
		XNote
	},

	props: {
		user: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			existMore: false,
			moreFetching: false,
			withFiles: false,
			images: [],
		};
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.$nextTick(() => {
				(this.$refs.timeline as any).init(() => this.initTl());
			});

			const image = [
				'image/jpeg',
				'image/png',
				'image/gif'
			];

			this.$root.api('users/notes', {
				userId: this.user.id,
				fileType: image,
				excludeNsfw: !this.$store.state.device.alwaysShowNsfw,
				limit: 9,
				untilDate: new Date().getTime() + 1000 * 86400 * 365
			}).then(notes => {
				for (const note of notes) {
					for (const file of note.files) {
						file._note = note;
					}
				}
				const files = concat(notes.map((n: any): any[] => n.files));
				this.images = files.filter(f => image.includes(f.type)).slice(0, 9);
			});

			this.$root.api('charts/user/notes', {
				userId: this.user.id,
				span: 'day',
				limit: 21
			}).then(stats => {
				const normal = [];
				const reply = [];
				const renote = [];

				const now = new Date();
				const y = now.getFullYear();
				const m = now.getMonth();
				const d = now.getDate();

				for (let i = 0; i < 21; i++) {
					const x = new Date(y, m, d - i);
					normal.push([
						x,
						stats.diffs.normal[i]
					]);
					reply.push([
						x,
						stats.diffs.reply[i]
					]);
					renote.push([
						x,
						stats.diffs.renote[i]
					]);
				}

				const chart = new ApexCharts(this.$refs.chart, {
					chart: {
						type: 'bar',
						stacked: true,
						height: 100,
						sparkline: {
							enabled: true
						},
					},
					plotOptions: {
						bar: {
							columnWidth: '90%'
						}
					},
					grid: {
						clipMarkers: false,
						padding: {
							top: 16,
							right: 16,
							bottom: 16,
							left: 16
						}
					},
					tooltip: {
						shared: true,
						intersect: false
					},
					series: [{
						name: 'Normal',
						data: normal
					}, {
						name: 'Reply',
						data: reply
					}, {
						name: 'Renote',
						data: renote
					}],
					xaxis: {
						type: 'datetime',
						crosshairs: {
							width: 1,
							opacity: 1
						}
					}
				});

				chart.render();
			});
		},

		initTl() {
			return new Promise((res, rej) => {
				this.$root.api('users/notes', {
					userId: this.user.id,
					limit: fetchLimit + 1,
					untilDate: new Date().getTime() + 1000 * 86400 * 365,
					withFiles: this.withFiles,
					includeMyRenotes: this.$store.state.settings.showMyRenotes,
					includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
					includeLocalRenotes: this.$store.state.settings.showLocalRenotes
				}).then(notes => {
					if (notes.length == fetchLimit + 1) {
						notes.pop();
						this.existMore = true;
					}
					res(notes);
				}, rej);
			});
		},

		fetchMoreNotes() {
			this.moreFetching = true;

			const promise = this.$root.api('users/notes', {
				userId: this.user.id,
				limit: fetchLimit + 1,
				untilDate: new Date((this.$refs.timeline as any).tail().createdAt).getTime(),
				withFiles: this.withFiles,
				includeMyRenotes: this.$store.state.settings.showMyRenotes,
				includeRenotedMyNotes: this.$store.state.settings.showRenotedMyNotes,
				includeLocalRenotes: this.$store.state.settings.showLocalRenotes
			});

			promise.then(notes => {
				if (notes.length == fetchLimit + 1) {
					notes.pop();
				} else {
					this.existMore = false;
				}
				for (const n of notes) (this.$refs.timeline as any).append(n);
				this.moreFetching = false;
			});

			return promise;
		}
	}
});
</script>

<style lang="stylus" scoped>
.sainvnaq
	display grid
	grid-template-columns 1fr 1fr 1fr
	gap 8px
	padding 16px

	> *
		height 70px
		background-position center center
		background-size cover
		background-clip content-box
		border-radius 4px

</style>
