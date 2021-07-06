import {registerSettings} from "./settings.js"

Hooks.once('init', async function () {
    registerSettings()
})

Hooks.once('ready', async function () {
    console.info("DungeonScrawlImporter ready.")
})