/**
 * Replace fontawesome symbols
 */

const StringReplacePlugin = require('string-replace-webpack-plugin');

const fontawesome = require('@fortawesome/fontawesome');
const solid = require('@fortawesome/fontawesome-free-solid');

// Adds all the icons from the Solid style into our library for easy lookup
fontawesome.library.add(solid);

export default () => ({
	enforce: 'pre',
	test: /\.(tag|js|ts)$/,
	exclude: /node_modules/,
	loader: StringReplacePlugin.replace({
		replacements: [{
			pattern: /%fa:(.+?)%/g, replacement: (_, key) => {
				const args = key.split(' ');
				let prefix = 'fas';
				let klass = '';
				let transform = '';
				let name;

				args.forEach(arg => {
					if (arg == 'R' || arg == 'S') {
						prefix =
							arg == 'R' ? 'far' :
							arg == 'S' ? 'fas' :
							'';
					} else if (arg[0] == '.') {
						klass += arg.substr(1) + ' ';
					} else if (arg[0] == '-') {
						transform = arg.substr(1).split('|').join(' ');
					} else {
						name = arg;
					}
				});

				const icon = fontawesome.icon({ prefix, iconName: name });

				if (icon) {
					icon.class = klass;
					icon.transform = fontawesome.parse.transform(transform);
					return `<i data-fa style="display:inline-block" class="${name}">${icon.html[0]}</i>`;
				} else {
					console.warn(`'${name}' not found in fa`);
					return '';
				}
			}
		}]
	})
});
