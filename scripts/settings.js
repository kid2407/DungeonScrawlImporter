import {DungeonScrawlImporterFormApplication} from "./DungeonScrawlImporterFormApplication"

const MODULE_ID = "dungeonScrawlImporter"
const DSI_SUBMENU = "dsi-submenu"

export function registerSettings() {
    game.settings.registerMenu(MODULE_ID, DSI_SUBMENU, {
        name:       "import",
        label:      "Import Dialogue",      // The text label used in the button
        hint:       "Import a Dungeon Scrawler file",
        icon:       "fas fa-wrench",               // A Font Awesome icon used in the submenu button
        type:       DungeonScrawlImporterFormApplication,   // A FormApplication subclass which should be created
        restricted: true                   // Restrict this submenu to gamemaster only?
    })
}

export {
    MODULE_ID,
    DSI_SUBMENU
}