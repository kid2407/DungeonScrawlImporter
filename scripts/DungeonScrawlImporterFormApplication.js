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
     * @param {Array} doorIDs
     * @param {Array} stairIDs
     * @param {int} gridCellSize
     * @param {int} offsetX
     * @param {int} offsetY
     */
    async parseShapes(shapes, doorIDs, stairsIds, gridCellSize, offsetX, offsetY) {
        let wallData          = []
        // noinspection JSValidateTypes
        let currentScene      = game.scenes.current
        const sceneDimensions = currentScene.dimensions
        const sceneCellSize   = sceneDimensions.size
        const gridFactor      = sceneCellSize / gridCellSize
        for (let k in shapes) {
            let isDoor = doorIDs.includes(k)
            if (!shapes.hasOwnProperty(k)) continue
            let element   = shapes[k]
            //If the element is a door the shape has to be reduced to a single segment to work properly as a foundry door.
            if (isDoor) {
                let doorVariant = 1
                if (element.polylines.length > 0) doorVariant = 0

                //For this variant the desired segment can be constructed by simply connecting the first point of the first polyline and the last point of the second polyline.
                if (doorVariant == 0) {
                    delete element.polygons
                    element.polylines = [[element.polylines[0][0], element.polylines[1][1]]]
                }
                //For this variant the desired segment can be constructed by shifting one of the long edges of the rectangular polygon.
                else if (doorVariant == 1) {
                    //Determine the side lengths of the rectangular polygon.
                    let doorLengths2 = []
                    for (let i = 0; i < element.polygons[0][0].length; i++) {
                        let doorLength2 = ((element.polygons[0][0][(i+1)%(element.polygons[0][0].length)][0] - element.polygons[0][0][i][0])**2 + (element.polygons[0][0][(i+1)%(element.polygons[0][0].length)][1] - element.polygons[0][0][i][1])**2)
                        doorLengths2.push(doorLength2)
                    }
                    //Grab one of the long sides of the rectangular polygon.
                    let longestSideIndex = doorLengths2.indexOf(Math.max(...doorLengths2))
                    let longestSide = [[element.polygons[0][0][longestSideIndex][0], element.polygons[0][0][longestSideIndex][1]],[element.polygons[0][0][(longestSideIndex+1)%(element.polygons[0][0].length)][0], element.polygons[0][0][(longestSideIndex+1)%(element.polygons[0][0].length)][1]]]

                    //Grab the next side over relative to the long side. Since the shape is always a rectangle this must be a short side.
                    let shortestSide = [[element.polygons[0][0][(longestSideIndex+1)%(element.polygons[0][0].length)][0], element.polygons[0][0][(longestSideIndex+1)%(element.polygons[0][0].length)][1]],[element.polygons[0][0][(longestSideIndex+2)%(element.polygons[0][0].length)][0], element.polygons[0][0][(longestSideIndex+2)%(element.polygons[0][0].length)][1]]]
                    //Determine the x,y offset, which is the difference between a point and a midway point along the short side.
                    let shortestSideMidPoint = [(shortestSide[0][0] + shortestSide[1][0])/2, (shortestSide[0][1] + shortestSide[1][1])/2]
                    let offset = [shortestSide[0][0] - shortestSideMidPoint[0], shortestSide[0][1] - shortestSideMidPoint[1]]
                    //Set the element's polyline to this single line segment, which is one of the long sides shifted by the previously determined offset along a short side.
                    element.polylines[0] = [[longestSide[0][0] - offset[0], longestSide[0][1] - offset[1]],[longestSide[1][0] - offset[0], longestSide[1][1] - offset[1]]]
                    //Delete the polygon.
                    delete element.polygons
                }
            }
            // Ignore stairs
            if (stairsIds.includes(k)) continue
            if (element.hasOwnProperty('polylines')) {
                element['polylines'].forEach((side) => {
                    //Each sequential pair of points is a possible line, and
                    //some of them won't have any length, so won't appear
                    for(let i = 0; i + 1 < side.length; i = i + 1) {
                        wallData.push({
                            c: [ side[i][0] * gridFactor, side[i][1] * gridFactor, side[i+1][0] * gridFactor, side[i+1][1] * gridFactor ],
                            'door': isDoor,
                        })
                    }
                })
            }
            if (element.hasOwnProperty('polygons')) {
                element['polygons'].forEach(polygon => {
                    polygon.forEach(list => {
                        let firstPoint = []
                        let lastPoint = []
                        list.forEach(side => {
                            let coordinates = [
                                side[0] * gridFactor,
                                side[1] * gridFactor
                            ]
                            //Save the first point to connect with the last point later
                            if (lastPoint.length == 0) {
                                firstPoint = coordinates
                            }
                            if (lastPoint.length > 0) {
                                wallData.push({
                                                  c: [
                                                      lastPoint[0],
                                                      lastPoint[1],
                                                      coordinates[0],
                                                      coordinates[1],
                                                  ],
                                                  'door': isDoor
                                              })
                            }
                            lastPoint = coordinates
                        })
                        wallData.push({
                            c: [
                                lastPoint[0],
                                lastPoint[1],
                                firstPoint[0],
                                firstPoint[1],
                            ],
                            'door': isDoor
                        })
                    })
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
     * @param {Object} dataNodes
     */
    getDoorIDs(dataNodes) {
        let doorIDs = []
        for (let node in dataNodes) {
            if (dataNodes[node].name == "Door geometry") doorIDs.push(dataNodes[node].geometryId)
        }
        return doorIDs
    }

    /**
     * @param {Object} dataNodes
     */
    getStairIDs(dataNodes) {
        let stairIDs = []
        for (let node in dataNodes) {
            if (dataNodes[node].name == "Stairs geometry") stairIDs.push(dataNodes[node].geometryId)
        }
        return stairIDs
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
            let doorIDs      = self.getDoorIDs(dataNodes)
            let stairIDs     = self.getStairIDs(dataNodes)
            let doc          = dataNodes.document
            let gridCellSize = dataNodes[doc.children[0]].grid.cellDiameter

            self.updateButtonStatus(game.i18n.localize("DSI.import.parsingfile"), true)
            await self.parseShapes(geometryData, doorIDs, stairIDs, gridCellSize, offsetX, offsetY)
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
