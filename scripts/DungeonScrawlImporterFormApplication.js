export class DungeonScrawlImporterFormApplication extends FormApplication {
    async _updateObject(event, formData) {
        return Promise.resolve(undefined)
    }

    get title() {
        return "DungeonScrawlImporter Importer"
    }

    static get defaultOptions() {
        const options    = super.defaultOptions
        options.id       = "dungeonScrawlImporter-import-dialogue"
        options.template = `modules/dungeon-scrawl-importer/templates/import-dialogue.hbs`
        options.width    = 500
        options.height   = "auto"

        return options
    }

    getData(options = {}) {
        // noinspection JSValidateTypes
        return {
            "headline":    game.i18n.localize("DSI.import.headline"),
            "chooseFile":  game.i18n.localize("DSI.import.chooseFile"),
            "buttonText":  game.i18n.localize("DSI.import.import"),
            "offsetXText": game.i18n.localize("DSI.import.offsetX"),
            "offsetYText": game.i18n.localize("DSI.import.offsetY")
        }
    }

    updateButtonStatus(text, disabled = false) {
        $('#processDSFile').attr("disabled", disabled).html(text)
    }

    /**
     * @param {Object} shapes
     * @param {int} gridCellSize
     * @param {int} offsetX
     * @param {int} offsetY
     */
    async parseShapes(shapes, gridCellSize, offsetX, offsetY) {
        let wallData          = []
        // noinspection JSValidateTypes
        let currentScene      = game.scenes.current
        const sceneDimensions = currentScene.dimensions
        const sceneCellSize   = sceneDimensions.size
        const gridFactor      = sceneCellSize / gridCellSize
        for (let k in shapes) {
            if (shapes.hasOwnProperty(k)) {
                let element   = shapes[k]
                let validKeys = ['polygons', 'polylines']
                validKeys.forEach((prop) => {
                    if (element.hasOwnProperty(prop)) {
                        element[prop].forEach(polygon => {
                            let lastPoint = []
                            let list
                            if (prop === 'polygons') {
                                list = polygon[0]
                            }
                            else {
                                list = polygon
                            }
                            list.forEach(side => {
                                let coordinates = [
                                    side[0] * gridFactor,
                                    side[1] * gridFactor
                                ]
                                if (lastPoint.length > 0) {
                                    wallData.push({
                                                      c: [
                                                          lastPoint[0],
                                                          lastPoint[1],
                                                          coordinates[0],
                                                          coordinates[1],
                                                      ]
                                                  })
                                }
                                lastPoint = coordinates
                            })
                        })
                    }
                })
            }
        }

        // Round to 3 decimals
        wallData = wallData.map(function (element) {
            element.c = element.c.map(value => Math.round(value * 100) / 100)
            return element
        })

        wallData = wallData.filter((value) => {
            return value.c[0] !== value.c[2] || value.c[1] !== value.c[3]
        })

        let uniqueKeys     = {}
        let uniqueWallData = wallData.filter((value) => {
            const key = value.c.join("_")
            if (uniqueKeys.hasOwnProperty(key)) {
                return false
            }

            uniqueKeys[key] = null
            return true
        })

        let mostNegativeX = Math.min(...uniqueWallData.map(value => value.c[0]), ...uniqueWallData.map(value => value.c[2]))
        let mostNegativeY = Math.min(...uniqueWallData.map(value => value.c[1]), ...uniqueWallData.map(value => value.c[3]))

        uniqueWallData = uniqueWallData.map(value => {
            value.c[0] = value.c[0] + sceneCellSize * offsetX + mostNegativeX * -1 + sceneDimensions.sceneX
            value.c[1] = value.c[1] + sceneCellSize * offsetY + mostNegativeY * -1 + sceneDimensions.sceneY
            value.c[2] = value.c[2] + sceneCellSize * offsetX + mostNegativeX * -1 + sceneDimensions.sceneX
            value.c[3] = value.c[3] + sceneCellSize * offsetY + mostNegativeY * -1 + sceneDimensions.sceneY
            return value
        })

        // noinspection JSUnresolvedFunction
        await game.scenes.current.createEmbeddedDocuments("Wall", uniqueWallData)
    }

    /**
     * @param {int} offsetX
     * @param {int} offsetY
     */
    async loadFileContent(offsetX, offsetY) {
        /** @var {File} */
        let file   = document.getElementsByName("filePath")[0].files[0]
        const self = this
        if (file) {
            let zip        = await JSZip.loadAsync(file)
            let key        = Object.keys(zip.files)[0]
            let targetFile = zip.files[key]
            let jsonData   = await targetFile.async("string")
            let data       = JSON.parse(jsonData)

            let geometryData = data.data.geometry
            let dataNodes    = data.state.document.nodes
            let doc          = dataNodes.document
            let gridCellSize = dataNodes[doc.children[0]].grid.cellDiameter

            self.updateButtonStatus(game.i18n.localize("DSI.import.parsingfile"), true)
            await self.parseShapes(geometryData, gridCellSize, offsetX, offsetY)
            self.updateButtonStatus(game.i18n.localize("DSI.import.finished"))
        }
        else {
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
            let offsetX = $('#dsiImportOffsetX').val()
            let offsetY = $('#dsiImportOffsetY').val()

            await this.loadFileContent(offsetX.length > 0 ? parseFloat(offsetX) : 0, offsetY.length > 0 ? parseFloat(offsetY) : 0)
        })
    }
}