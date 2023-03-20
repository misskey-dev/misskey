import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';

addons.setConfig({
	theme: create({
		base: 'dark',
		brandTitle: 'Misskey Storybook',
		brandUrl: 'https://misskey-hub.net',
		brandImage: 'https://github.com/misskey-dev/assets/blob/main/misskey.svg?raw=true',
		brandTarget: '_blank',
	}),
});
