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

    getData(options = {}) {
        // noinspection JSValidateTypes
        return {
            "headline"  : game.i18n.localize("DSI.import.headline"),
            "chooseFile": game.i18n.localize("DSI.import.chooseFile"),
            "buttonText": game.i18n.localize("DSI.import.import")
        }
    }

    static updateButtonStatus(text, disabled = false) {
        $('#processDSFile').html(text).attr("disabled", disabled)
    }

    async parseShapes(shapes) {
        let wallData = []
        shapes.forEach(function (level_1_value) {
            level_1_value.forEach(function (level_2_value) {
                level_2_value.forEach(function (connectedLine) {
                    let lastPoint = []
                    connectedLine.forEach(function (coordinates) {
                        if (lastPoint.length > 0) {
                            wallData.push({c: [lastPoint[0], lastPoint[1], coordinates[0], coordinates[1]]})
                        }
                        lastPoint = coordinates
                    })

                })
            })
        })
        // noinspection JSUnresolvedFunction
        await canvas.scene.createEmbeddedDocuments("Wall", wallData);
    }

    async loadFileContent() {
        /** @var {File} */
        let file = document.getElementsByName("filePath")[0].files[0]
        if (file) {
            let reader = new FileReader()
            reader.readAsText(file, "UTF-8")
            reader.onload = async function (evt) {
                try {
                    // noinspection JSCheckFunctionSignatures
                    /** @type {{version: int, layerController: {assets: {}, config: {}, layers: {blendMode: string, config: {}, id: int, name: string, opacity: int, shape: {currentShapeIndex: int, shapeMemory: array}, type: int, unlinked: boolean, visible: boolean}[]}}} parsed */
                    const parsed = JSON.parse(evt.target.result)
                    const shapeMemory = parsed.layerController.layers[1].shape.shapeMemory
                    self.updateButtonStatus(game.i18n.localize("DSI.import.parsingfile"), true)
                    await self.parseShapes(shapeMemory)
                    self.updateButtonStatus(game.i18n.localize("DSI.import.finished"))
                } catch (exception) {
                    $('#dsimportErrorMessage').html(game.i18n.localize("DSI.import.error.invalidFile") + exception.message).addClass("visible")
                    self.updateButtonStatus(game.i18n.localize("DSI.import.import"))
                }
            }
            reader.onerror = function (reader) {
                $('#dsimportErrorMessage').html(game.i18n.localize("DSI.import.error.invalidFile") + reader.error).addClass("visible")
                self.updateButtonStatus(game.i18n.localize("DSI.import.import"))
            }
        } else {
            $('#dsimportErrorMessage').html(game.i18n.localize("DSI.import.error.noFile")).addClass("visible")
            self.updateButtonStatus(game.i18n.localize("DSI.import.import"))
        }
    }

    activateListeners(html) {
        super.activateListeners(html)

        html.find("button#processDSFile").click(async (event) => {
            event.preventDefault()
            $('#dsimportErrorMessage').html("").removeClass("visible")
            self.updateButtonStatus(game.i18n.localize("DSI.import.inprogress"), true)
            await this.loadFileContent()
        })
    }
}