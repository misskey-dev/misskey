/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkAbuseReport from './MkAbuseReport.vue';
const meta = {
	title: 'components/MkAbuseReport',
	component: MkAbuseReport,
} satisfies Meta<typeof MkAbuseReport>;
export const Default = {
	render(args) {
		return {
			components: {
				MkAbuseReport,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkAbuseReport v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAbuseReport>;
export default meta;
