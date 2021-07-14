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
        options.height = 500

        return options
    }

    getData(options = {}) {
        // noinspection JSValidateTypes
        return {
            "headline"   : game.i18n.localize("DSI.import.headline"),
            "chooseFile" : game.i18n.localize("DSI.import.chooseFile"),
            "buttonText" : game.i18n.localize("DSI.import.import"),
            "offsetXText": game.i18n.localize("DSI.import.offsetX"),
            "offsetYText": game.i18n.localize("DSI.import.offsetY")
        }
    }

    updateButtonStatus(text, disabled = false) {
        $('#processDSFile').attr("disabled", disabled).html(text)
    }

    async parseShapes(shapes, gridCellSize, offsetX, offsetY) {
        let wallData = []
        // noinspection JSValidateTypes
        /** @var {{distance: int, height: int, width: int, paddingX: int, paddingY: int, sceneHeight: int, sceneWidth: int, size: int}} sceneDimensions */
        const sceneDimensions = game.scenes.current.dimensions
        const sceneCellSize = sceneDimensions.size
        const gridFactor = sceneCellSize / gridCellSize
        shapes.forEach(function (level_1_value) {
            level_1_value.forEach(function (level_2_value) {
                level_2_value.forEach(function (connectedLine) {
                    let lastPoint = []
                    connectedLine.forEach(function (coordinates) {
                        coordinates = [
                            coordinates[0] * gridFactor + sceneDimensions.paddingX,
                            coordinates[1] * gridFactor + sceneDimensions.paddingY
                        ]
                        if (lastPoint.length > 0) {
                            wallData.push({c: [lastPoint[0], lastPoint[1], coordinates[0], coordinates[1]]})
                        }
                        lastPoint = coordinates
                    })

                })
            })
        })

        console.log(`Number of all walls: ${wallData.length}`)

        console.log("START - Rounding to 3 decimals")
        // Round to 3 decimals
        wallData = wallData.map(function (element) {
            element.c = element.c.map(value => Math.round(value * 100) / 100)
            return element
        })
        console.log("END - Rounding to 3 decimals")

        console.log("START - Removing walls with length 0")
        wallData = wallData.filter((value) => {
            return value.c[0] !== value.c[2] || value.c[1] !== value.c[3]
        })
        console.log("END - Removing walls with length 0")
        console.log(`After removing 0 length walls: ${wallData.length}`)

        console.log("START - Removing all duplicates")
        let uniqueKeys = {}
        let uniqueWallData = wallData.filter((value) => {
            const key = value.c.join("_")
            if (uniqueKeys.hasOwnProperty(key)) {
                return false
            }

            uniqueKeys[key] = null
            return true
        });
        console.log("END - Removing all duplicates")

        console.log(`Number of unique walls: ${uniqueWallData.length}`)

        console.log("START - Shift coordinates into scene")

        let mostNegativeX = Math.min(...uniqueWallData.map(value => value.c[0]), ...uniqueWallData.map(value => value.c[2]), 0)
        let mostNegativeY = Math.min(...uniqueWallData.map(value => value.c[1]), ...uniqueWallData.map(value => value.c[3]), 0)

        if (mostNegativeX < 0 || mostNegativeY < 0) {
            uniqueWallData = uniqueWallData.map(value => {
                value.c[0] = value.c[0] + mostNegativeX * -1 + sceneCellSize * offsetX
                value.c[1] = value.c[1] + mostNegativeY * -1 + sceneCellSize * offsetY
                value.c[2] = value.c[2] + mostNegativeX * -1 + sceneCellSize * offsetX
                value.c[3] = value.c[3] + mostNegativeY * -1 + sceneCellSize * offsetY
                return value
            })
        }

        console.log("END - Shift coordinates into scene")

        console.log("START - Creating walls")
        // noinspection JSUnresolvedFunction
        await game.scenes.current.createEmbeddedDocuments("Wall", uniqueWallData);
        console.log("STOP - Creating walls")
    }

    /**
     * @param {int} offsetX
     * @param {int} offsetY
     */
    async loadFileContent(offsetX, offsetY) {
        /** @var {File} */
        let file = document.getElementsByName("filePath")[0].files[0]
        const self = this
        if (file) {
            let reader = new FileReader()
            reader.readAsText(file, "UTF-8")
            reader.onload = async function (evt) {
                try {
                    // noinspection JSCheckFunctionSignatures
                    /** @type {{version: int, layerController: {assets: {}, config: {gridCellSize: int}, layers: {blendMode: string, config: {}, id: int, name: string, opacity: int, shape: {currentShapeIndex: int, shapeMemory: array}, type: int, unlinked: boolean, visible: boolean}[]}}} parsed */
                    const parsed = JSON.parse(evt.target.result)
                    const shapeMemory = parsed.layerController.layers[1].shape.shapeMemory
                    const gridCellSize = parsed.layerController.config.gridCellSize
                    self.updateButtonStatus(game.i18n.localize("DSI.import.parsingfile"), true)
                    await self.parseShapes(shapeMemory, gridCellSize, offsetX, offsetY)
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
            this.updateButtonStatus(game.i18n.localize("DSI.import.inprogress"), true)
            await this.loadFileContent($('#dsiImportOffsetX').val() ?? 0, $('#dsiImportOffsetY').val() ?? 0)
        })
    }
}