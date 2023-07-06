import {DungeonScrawlImporterFormApplication} from "./DungeonScrawlImporterFormApplication.js"

Hooks.on('renderSidebarTab', async function (app, html) {
    if (app.options.classes.includes("scenes-sidebar") && game.user.isGM) {
        let button = $(`<div class='header-actions action-buttons flexrow'><button><i class='fas fa-file-import'></i> ${game.i18n.localize("DSI.button")}</button></div>`)
        button.on('click', async () => {
            if (!game.users.current.isGM) {
                return false
            }

            let dialog = new DungeonScrawlImporterFormApplication()
            return dialog.render(true)
        })

        $(html).find('.directory-header').prepend(button)
    }
})