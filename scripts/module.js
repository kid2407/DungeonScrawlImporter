import {registerSettings} from "./settings"

Hooks.once('init', async function () {
    registerSettings()
})

Hooks.once('ready', async function () {
    console.info("DungeonScrawlImporter ready.")
})

function processFile(filePath) {

}