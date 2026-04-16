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
import { cuboid } from './objects/cuboid.js';
import { cupNoodle } from './objects/cupNoodle.js';
import { custardPudding } from './objects/custardPudding.js';
import { debugHipoly } from './objects/debugHipoly.js';
import { desk } from './objects/desk.js';
import { desktopPc } from './objects/desktopPc.js';
import { djMixer } from './objects/djMixer.js';
import { djPlayer } from './objects/djPlayer.js';
import { ductTape } from './objects/ductTape.js';
import { emptyBento } from './objects/emptyBento.js';
import { energyDrink } from './objects/energyDrink.js';
import { envelope } from './objects/envelope.js';
import { facialTissue } from './objects/facialTissue.js';
import { hangingTShirt } from './objects/hangingTShirt.js';
import { icosahedron } from './objects/icosahedron.js';
import { ironFrameShelf5, ironFrameShelf4, ironFrameShelf3 } from './objects/ironFrameShelf.js';
import { ironFrameTable } from './objects/ironFrameTable.js';
import { keyboard } from './objects/keyboard.js';
import { laptopPc } from './objects/laptopPc.js';
import { lavaLamp } from './objects/lavaLamp.js';
import { letterCase } from './objects/letterCase.js';
import { miObjet } from './objects/mi-objet.js';
import { milk } from './objects/milk.js';
import { miPlate } from './objects/miPlate.js';
import { miPlateDisplayed } from './objects/miPlateDisplayed.js';
import { mixer } from './objects/mixer.js';
import { monitor } from './objects/monitor.js';
import { monitorSpeaker } from './objects/monitorSpeaker.js';
import { monstera } from './objects/monstera.js';
import { mug } from './objects/mug.js';
import { newtonsCradle } from './objects/newtonsCradle.js';
import { openedCardboardBox } from './objects/openedCardboardBox.js';
import { pachira } from './objects/pachira.js';
import { pc } from './objects/pc.js';
import { petBottle } from './objects/petBottle.js';
import { piano } from './objects/piano.js';
import { pictureFrame } from './objects/pictureFrame.js';
import { pizza } from './objects/pizza.js';
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
import { sprayer } from './objects/sprayer.js';
import { steelRack } from './objects/steelRack.js';
import { tabletopCalendar } from './objects/tabletopCalendar.js';
import { tabletopDigitalClock } from './objects/tabletopDigitalClock.js';
import { tabletopFlag } from './objects/tabletopFlag.js';
import { tabletopGlassPictureFrame } from './objects/tabletopGlassPictureFrame.js';
import { tabletopIronFrameStand } from './objects/tabletopIronFrameStand.js';
import { tabletopPictureFrame } from './objects/tabletopPictureFrame.js';
import { tapestry } from './objects/tapestry.js';
import { tetrapod } from './objects/tetrapod.js';
import { tv } from './objects/tv.js';
import { twistedCubeObjet } from './objects/twistedCubeObjet.js';
import { usedTissue } from './objects/usedTissue.js';
import { wallCanvas } from './objects/wallCanvas.js';
import { wallClock } from './objects/wallClock.js';
import { wallGlassPictureFrame } from './objects/wallGlassPictureFrame.js';
import { wallMirror } from './objects/wallMirror.js';
import { wallShelf } from './objects/wallShelf.js';
import { woodRingFloorLamp } from './objects/woodRingFloorLamp.js';
import { woodRingsPendantLight } from './objects/woodRingsPendantLight.js';
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
	cuboid,
	cupNoodle,
	custardPudding,
	desk,
	desktopPc,
	djMixer,
	djPlayer,
	ductTape,
	emptyBento,
	energyDrink,
	envelope,
	facialTissue,
	hangingTShirt,
	icosahedron,
	ironFrameShelf5,
	ironFrameShelf4,
	ironFrameShelf3,
	ironFrameTable,
	keyboard,
	laptopPc,
	lavaLamp,
	letterCase,
	miObjet,
	milk,
	miPlate,
	miPlateDisplayed,
	mixer,
	monitor,
	monitorSpeaker,
	monstera,
	mug,
	newtonsCradle,
	openedCardboardBox,
	pachira,
	pc,
	petBottle,
	piano,
	pictureFrame,
	pizza,
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
	sprayer,
	steelRack,
	tabletopCalendar,
	tabletopDigitalClock,
	tabletopFlag,
	tabletopGlassPictureFrame,
	tabletopIronFrameStand,
	tabletopPictureFrame,
	tapestry,
	tetrapod,
	tv,
	twistedCubeObjet,
	usedTissue,
	wallCanvas,
	wallClock,
	wallGlassPictureFrame,
	wallMirror,
	wallShelf,
	woodRingFloorLamp,
	woodRingsPendantLight,
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
