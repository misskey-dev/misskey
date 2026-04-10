/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { a4Case } from './objects/a4Case.js';
import { aircon } from './objects/aircon.js';
import { allInOnePc } from './objects/allInOnePc.js';
import { aquarium } from './objects/aquarium.js';
import { aromaReedDiffuser } from './objects/aromaReedDiffuser.js';
import { banknote } from './objects/banknote.js';
import { beamLamp } from './objects/beamLamp.js';
import { bed } from './objects/bed.js';
import { blind } from './objects/blind.js';
import { book } from './objects/book.js';
import { books } from './objects/books.js';
import { cactusS } from './objects/cactusS.js';
import { cardboardBox } from './objects/cardboardBox.js';
import { ceilingFanLight } from './objects/ceilingFanLight.js';
import { chair } from './objects/chair.js';
import { coffeeCup } from './objects/coffeeCup.js';
import { colorBox } from './objects/colorBox.js';
import { cupNoodle } from './objects/cupNoodle.js';
import { custardPudding } from './objects/custardPudding.js';
import { debugHipoly } from './objects/debugHipoly.js';
import { desk } from './objects/desk.js';
import { desktopPc } from './objects/desktopPc.js';
import { ductTape } from './objects/ductTape.js';
import { emptyBento } from './objects/emptyBento.js';
import { energyDrink } from './objects/energyDrink.js';
import { envelope } from './objects/envelope.js';
import { facialTissue } from './objects/facialTissue.js';
import { hangingTShirt } from './objects/hangingTShirt.js';
import { icosahedron } from './objects/icosahedron.js';
import { keyboard } from './objects/keyboard.js';
import { laptopPc } from './objects/laptopPc.js';
import { lavaLamp } from './objects/lavaLamp.js';
import { letterCase } from './objects/letterCase.js';
import { milk } from './objects/milk.js';
import { miPlate } from './objects/miPlate.js';
import { miPlateDisplayed } from './objects/miPlateDisplayed.js';
import { mixer } from './objects/mixer.js';
import { monitor } from './objects/monitor.js';
import { monitorSpeaker } from './objects/monitorSpeaker.js';
import { monstera } from './objects/monstera.js';
import { mug } from './objects/mug.js';
import { openedCardboardBox } from './objects/openedCardboardBox.js';
import { pachira } from './objects/pachira.js';
import { pc } from './objects/pc.js';
import { petBottle } from './objects/petBottle.js';
import { piano } from './objects/piano.js';
import { pictureFrame } from './objects/pictureFrame.js';
import { plant } from './objects/plant.js';
import { plant2 } from './objects/plant2.js';
import { poster } from './objects/poster.js';
import { powerStrip } from './objects/powerStrip.js';
import { radiometer } from './objects/radiometer.js';
import { randomBooks } from './objects/randomBooks.js';
import { rolledUpPoster } from './objects/rolledUpPoster.js';
import { roundRug } from './objects/roundRug.js';
import { router } from './objects/router.js';
import { siphon } from './objects/siphon.js';
import { snakeplant } from './objects/snakeplant.js';
import { speaker } from './objects/speaker.js';
import { steelRack } from './objects/steelRack.js';
import { tabletopCalendar } from './objects/tabletopCalendar.js';
import { tabletopDigitalClock } from './objects/tabletopDigitalClock.js';
import { tabletopFlag } from './objects/tabletopFlag.js';
import { tabletopPictureFrame } from './objects/tabletopPictureFrame.js';
import { tapestry } from './objects/tapestry.js';
import { tetrapod } from './objects/tetrapod.js';
import { tv } from './objects/tv.js';
import { wallCanvas } from './objects/wallCanvas.js';
import { wallClock } from './objects/wallClock.js';
import { wallMirror } from './objects/wallMirror.js';
import { wallShelf } from './objects/wallShelf.js';
import { woodRingFloorLamp } from './objects/woodRingFloorLamp.js';
import { woodSoundAbsorbingPanel } from './objects/woodSoundAbsorbingPanel.js';

export const OBJECT_DEFS = [
	a4Case,
	aircon,
	allInOnePc,
	aquarium,
	aromaReedDiffuser,
	banknote,
	beamLamp,
	bed,
	blind,
	book,
	books,
	cactusS,
	cardboardBox,
	ceilingFanLight,
	chair,
	coffeeCup,
	colorBox,
	cupNoodle,
	custardPudding,
	desk,
	desktopPc,
	ductTape,
	emptyBento,
	energyDrink,
	envelope,
	facialTissue,
	hangingTShirt,
	icosahedron,
	keyboard,
	laptopPc,
	lavaLamp,
	letterCase,
	milk,
	miPlate,
	miPlateDisplayed,
	mixer,
	monitor,
	monitorSpeaker,
	monstera,
	mug,
	openedCardboardBox,
	pachira,
	pc,
	petBottle,
	piano,
	pictureFrame,
	plant,
	plant2,
	poster,
	powerStrip,
	radiometer,
	randomBooks,
	rolledUpPoster,
	roundRug,
	router,
	siphon,
	snakeplant,
	speaker,
	steelRack,
	tabletopCalendar,
	tabletopDigitalClock,
	tabletopFlag,
	tabletopPictureFrame,
	tapestry,
	tetrapod,
	tv,
	wallCanvas,
	wallClock,
	wallMirror,
	wallShelf,
	woodRingFloorLamp,
	woodSoundAbsorbingPanel,
	debugHipoly,
];

export function getObjectDef(type: string): typeof OBJECT_DEFS[number] {
	const def = OBJECT_DEFS.find(x => x.id === type);
	if (def == null) {
		throw new Error(`Unrecognized object type: ${type}`);
	}
	return def;
}
