const EXTENSION_ID = 'kopocogfhjibbmmloihmoedegihaajfm';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (sender.id !== EXTENSION_ID) {
        return false;
    }
    if (request.action === 'pasteValue' && request.value) {
        const activeElement = document.activeElement;
        if (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        ) {
            try {
                document.execCommand('insertText', false, request.value);
                sendResponse({ status: 'success' });
            } catch (error) {
                console.error('Error pasting text:', error);
                sendResponse({ status: 'error', message: error.message });
            }
        } else {
            console.error('No editable element focused');
            sendResponse({ status: 'error', message: 'No editable element focused' });
        }
        return true;
    }
    return false;
});