import {DungeonScrawlImporterFormApplication} from "./DungeonScrawlImporterFormApplication.js"

// console.log("=== DUNGEON SCRAWL IMPORTER: v13 Corrected Hook Name ===");

// IT'S SINGULAR - renderSceneDirectory not renderScenesDirectory!
Hooks.on('renderSceneDirectory', async function (app, element, context) {
    // console.log("DSI: renderSceneDirectory hook fired!");
    // console.log("DSI: app:", app);
    // console.log("DSI: element:", element);
    // console.log("DSI: element type:", typeof element);
    
    if (!game.user.isGM) {
        // console.log("DSI: User is not GM, skipping button");
        return;
    }
    
    // console.log("DSI: User is GM, adding button");
    
    try {
        // Create the button - use plain HTML string
        const buttonHtml = `
            <button class="dsi-import-button" type="button">
                <i class="fas fa-file-import"></i>
                ${game.i18n.localize("DSI.button")}
            </button>
        `;
        
        // console.log("DSI: Button HTML created");
        
        // In ApplicationV2, element is an HTMLElement, not jQuery
        // Find the header
        let header = element.querySelector('header.directory-header');
        
        if (!header) {
            // console.log("DSI: header.directory-header not found, trying alternatives");
            header = element.querySelector('header');
        }
        
        if (!header) {
            // console.log("DSI: No header found, trying .directory-header class");
            header = element.querySelector('.directory-header');
        }
        
        // console.log("DSI: Header found:", header);
        
        if (header) {
            // Insert the button at the beginning of the header
            header.insertAdjacentHTML('afterbegin', `<div class="header-actions action-buttons flexrow">${buttonHtml}</div>`);
            // console.log("DSI: Button HTML inserted");
            
            // Now find the button we just added and attach the click handler
            const button = header.querySelector('.dsi-import-button');
            // console.log("DSI: Button element:", button);
            
            if (button) {
                button.addEventListener('click', async (event) => {
                    // console.log("DSI: Button clicked!");
                    event.preventDefault();
                    
                    if (!game.users.current.isGM) {
                        // console.log("DSI: User is not GM, aborting");
                        return false;
                    }

                    try {
                        let dialog = new DungeonScrawlImporterFormApplication();
                        return dialog.render(true);
                    } catch (err) {
                        console.error("DSI: Error rendering dialog:", err);
                    }
                });
                
                // console.log("DSI: ✓✓✓ Button added and click handler attached successfully!");
            } else {
                console.error("DSI: Could not find button after insertion");
            }
        } else {
            console.error("DSI: Could not find header element");
            console.log("DSI: Available elements:", element);
            console.log("DSI: Element HTML:", element.innerHTML);
        }
    } catch (error) {
        console.error("DSI: Error in hook function:", error);
        console.error("DSI: Stack:", error.stack);
    }
});

// console.log("DSI: Hook registered successfully!");
// console.log("=== DUNGEON SCRAWL IMPORTER: Initialization complete ===");
