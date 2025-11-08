function createContextMenu() {
    // Retrieve the number of stored values to determine how many menu items to create
    chrome.storage.local.get(["values"], (result) => {
        let values = result.values || [];
        let numItems = Math.min(values.length + 1, 10);
        chrome.contextMenus.removeAll(() => {
            // Creates the root context menu
            const rootId = chrome.contextMenus.create({
                id: "root-menu",
                title: "Quick Copy",
                contexts: ["selection", "editable"]
            });
            doesValuesExist().then(exists => {
                if (exists) {
                    //Creating context menus for saving values
                    const copyId = chrome.contextMenus.create({
                        id: "save-menu",
                        title: "Save Value",
                        parentId: rootId,
                        contexts: ["selection"]
                    });
                    for (let i = 0; i < numItems; i++) {
                        let title;
                        if (i < values.length) {
                            title = `Replace As Value ${i + 1}`;
                        } else {
                            title = `Save As Value ${i + 1}`;
                        }
                        chrome.contextMenus.create({
                            id: `save-value-${i + 1}`,
                            title: title,
                            parentId: copyId,
                            contexts: ["selection"]
                        });
                    }
                    //Creating context menus for pasting values
                    const pasteId = chrome.contextMenus.create({
                        id: "paste-menu",
                        title: "Paste Value",
                        parentId: rootId,
                        contexts: ["editable"]
                    });
                    for (let i = 0; i < numItems - 1; i++) {
                        let title = `Paste The Value At ${i + 1}`;
                        chrome.contextMenus.create({
                            id: `paste-value-${i + 1}`,
                            title: title,
                            parentId: pasteId,
                            contexts: ["editable"]
                        });
                    }
                }
                else {
                    //Catch for first value
                    for (let i = 0; i < numItems; i++) {
                        let title;
                        title = `Save As Value ${i + 1}`;
                        chrome.contextMenus.create({
                            id: `save-value-${i + 1}`,
                            title: title,
                            parentId: rootId,
                            contexts: ["selection"]
                        });
                    }
                }
            });
        });
    });
}
// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const menuItemId = info.menuItemId;
    // When copying values...
    if (menuItemId.startsWith("save-value-")) {
        if (info.selectionText) {
            const valueNum = parseInt(info.menuItemId.split("-")[2]);
            const index = valueNum - 1;
            chrome.storage.local.get(["values"], (result) => {
                let values = result.values || [];
                while (values.length <= index) {
                    values.push("");
                }
                values[index] = info.selectionText.trim();
                chrome.storage.local.set({ values: values }, () => {
                    console.log(`Saved "${info.selectionText}" as Value ${valueNum} at index ${index}`);
                });
            });
        }
    }
    // When pasting values...
    else if (menuItemId.startsWith("paste-value-")) {
        const valueNum = parseInt(info.menuItemId.split("-")[2]);
        const index = valueNum - 1;
        chrome.storage.local.get(["values"], (result) => {
            let values = result.values || [];
            chrome.tabs.sendMessage(tab.id, {
                action: "pasteValue",
                value: values[index]
            });
        });
    }
});
function doesValuesExist() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["values"], (result) => {
            resolve(result.hasOwnProperty("values") && Array.isArray(result.values) && result.values.length > 0);
        });
    });
}
// Update context menu when storage changes
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && "values" in changes) {
        createContextMenu();
    }
});
// Initialize context menu when extension is installed/loaded
chrome.runtime.onInstalled.addListener(() => {
    createContextMenu();
});
// Hotkey commands
chrome.commands.onCommand.addListener((command) => {
    if (command.startsWith("paste-value-")) {
        const valueNum = parseInt(command.split("-")[2]);
        const index = valueNum - 1;
        chrome.storage.local.get(["values"], (result) => {
            let values = result.values || [];
            if (values[index]) {
                // Get the active tab to send the message
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0 || !tabs[0].url || tabs[0].url.startsWith("chrome://")) {
                        console.error("Cannot paste in chrome:// URLs or no active tab");
                        return;
                    }
                    // Send message to content script
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "pasteValue",
                        value: values[index]
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn("Content script not found, injecting script:", chrome.runtime.lastError.message);
                            chrome.scripting.executeScript({
                                target: { tabId: tabs[0].id },
                                files: ["content-script.js"]
                            }, () => {
                                if (chrome.runtime.lastError) {
                                    console.error("Failed to inject content script:", chrome.runtime.lastError.message);
                                    return;
                                }
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: "pasteValue",
                                    value: values[index]
                                }, (retryResponse) => {
                                    if (chrome.runtime.lastError) {
                                        console.error("Retry failed:", chrome.runtime.lastError.message);
                                    } else {
                                        console.log(`Sent value "${values[index]}" to content script for pasting`);
                                    }
                                });
                            });
                        } else {
                            console.log(`Sent value "${values[index]}" to content script for pasting`);
                        }
                    });
                });
            } else {
                console.log(`No value found at index ${index}`);
            }
        });
    }
});