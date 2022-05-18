import tinycolor from 'tinycolor2';

export class uniformThemecolor1652859567549 {
	name = 'uniformThemecolor1652859567549'

	async up(queryRunner) {
		const formatColor = (color) => {
			let tc = new tinycolor(color);
			if (color.isValid()) {
				return color.toHexString();
			} else {
				return null;
			}
		};

		await Promise.all(queryRunner.query('SELECT "id", "themeColor" FROM "instance" WHERE "themeColor" IS NOT NULL')
		.then(instances => instances.map(instance => {
			// update theme color to uniform format, e.g. #00ff00
			// invalid theme colors get set to null
			instance.color = formatColor(instance.color);

			return queryRunner.query('UPDATE "instance" SET "themeColor" = :themeColor WHERE "id" = :id', instance);
		})));

		// also fix own theme color
		await queryRunner.query('SELECT "themeColor" FROM "meta" WHERE "themeColor" IS NOT NULL LIMIT 1')
		.then(metas => {
			if (metas.length > 0) {
				return queryRunner.query('UPDATE "meta" SET "themeColor" = :color', { color: formatColor(metas[0].color) });
			}
		});
	}

	async down(queryRunner) {
		// The original representation is not stored, so migrating back is not possible.
		// The new format also works in older versions so this is not a problem.
	}
}
