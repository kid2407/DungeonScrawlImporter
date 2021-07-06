import {MODULE_ID} from "./settings.js"

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

    static parseShapes(shapes) {
        let timesWritten = 0

        shapes.forEach(function (level_1_value) {
            level_1_value.forEach(function (level_2_value) {
                level_2_value.forEach(function (connectedLine) {
                    connectedLine.forEach(function (coordinates) {
                        if (timesWritten > 20) {
                            console.log(coordinates)
                            return
                        }
                        timesWritten++
                    })
                })
            })
        })
    }

    loadFileContent() {
        let file = document.getElementsByName("filePath")[0].files[0]
        if (file) {
            let reader = new FileReader()
            reader.readAsText(file, "UTF-8");
            reader.onload = function (evt) {
                /** @type {{version: int, layerController: {assets: {}, config: {}, layers: {blendMode: string, config: {}, id: int, name: string, opacity: int, shape: {currentShapeIndex: int, shapeMemory: array}, type: int, unlinked: boolean, visible: boolean}[]}}} parsed */
                const parsed = JSON.parse(evt.target.result)
                const shapeMemory = parsed.layerController.layers[1].shape.shapeMemory
                console.log(shapeMemory)
                DungeonScrawlImporterFormApplication.parseShapes(shapeMemory)
            }
            reader.onerror = function () {
                document.getElementById("fileContents").innerHTML = "error reading file"
            }
        }
    }

    activateListeners(html) {
        super.activateListeners(html)

        html.find("button#processDSFile").click(async (event) => {
            event.preventDefault()
            this.loadFileContent()
        })
    }
}