import {DungeonScrawlImporterFormApplication} from "./DungeonScrawlImporterFormApplication.js"

const MODULE_ID = "dungeon-scrawl-importer"
const DSI_SUBMENU = "dsi-submenu"

export function registerSettings() {
    game.settings.registerMenu(MODULE_ID, DSI_SUBMENU, {
        name      : game.i18n.localize("DSI.config.importLabel"),
        label     : game.i18n.localize("DSI.config.openImportDialogue"),      // The text label used in the button
        hint      : game.i18n.localize("DSI.config.dialogueHint"),
        icon      : "fas fa-upload",               // A Font Awesome icon used in the submenu button
        type      : DungeonScrawlImporterFormApplication,   // A FormApplication subclass which should be created
        restricted: true                   // Restrict this submenu to gamemaster only?
    })
}

export {
    MODULE_ID,
    DSI_SUBMENU
}