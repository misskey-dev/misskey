/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from '@storybook/addon-actions';
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { userDetailed } from '../../.storybook/fakes';
import { commonHandlers } from '../../.storybook/mocks';
import MkAbuseReportWindow from './MkAbuseReportWindow.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAbuseReportWindow,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
				events() {
					return {
						'closed': action('closed'),
					};
				},
			},
			template: '<MkAbuseReportWindow v-bind="props" v-on="events" />',
		};
	},
	args: {
		user: userDetailed(),
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/users/report-abuse', async (req, res, ctx) => {
					action('POST /api/users/report-abuse')(await req.json());
					return res(ctx.json({}));
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkAbuseReportWindow>;
