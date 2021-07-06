import {DSI_SUBMENU, MODULE_ID} from "./settings"

export class DungeonScrawlImporterFormApplication extends FormApplication {
    async _updateObject(event, formData) {
        return Promise.resolve(undefined)
    }

    get title() {
        return "DungeonScrawlImporter Importer"
    }

    static get defaultOptions() {
        const options = super.defaultOptions
        options.id = "dungeonScrawlImporter-import-dialogue"
        options.template = `modules/${MODULE_ID}/templates/import-dialogue.hbs`
        options.width = 500

        return options
    }

    /** @override */
    async getData(options = {}) {
        const filePath = game.settings.get(MODULE_ID, DSI_SUBMENU)
        return {
            filePath: filePath
        }
    }

    activateListeners(html) {
        super.activateListeners(html)

        html.find("button#processDSFile").click(async (event) => {
            event.preventDefault()
            this.processFile()
        })
    }

    processFile() {
        console.log("File Path: " + game.settings.get(MODULE_ID, DSI_FILE_PATH))
    }
}