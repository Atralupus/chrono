const scriptElement = document.createElement("script");
scriptElement.src = chrome.runtime.getURL("content-scripts/global.js");

const port = chrome.runtime.connect({
    name: "content-script"
});

port.onMessage.addListener((res, _) => {
    const messageId = res.messageId;

    if (res && typeof res === 'object' && res.hasOwnProperty('error')) {
        window.postMessage({
            type: "FROM_CHRONO",
            messageId: messageId,
            error: res.error,
        });
    } else {
        window.postMessage({
            type: "FROM_CHRONO",
            messageId: messageId,
            result: res.result,
        });
    }
})

window.addEventListener('message', async function(event) {
    if (event.source != window)
        return;

    if (!event.data.type || event.data.type !== 'FROM_PAGE') {
        return;
    }

    const messageId = event.data.messageId;
    const method = event.data.method;

    try {
        if (method === "sign") {
            port.postMessage({
                action: 'wallet',
                method: 'sign',
                params: [event.data.signer, event.data.action],
                messageId,
            });
        } else if (method === "signTx") {
            port.postMessage({
                action: 'wallet',
                method: 'signTx',
                params: [event.data.signer, event.data.utx],
                messageId,
            });
        } else if (method === "listAccounts") {
            port.postMessage({
                action: 'wallet',
                method: 'listAccounts',
                params: [],
                messageId,
            });
        } else if (method === "getPublicKey") {
            port.postMessage({
                action: 'wallet',
                method: 'getPublicKey',
                params: [event.data.address],
                messageId,
            });
        }
    } catch(e) {
        console.error(e);
        window.postMessage({
            type: "FROM_CHRONO",
            messageId: messageId,
            error: e,
        }, event.source.origin);
    }
});
document.documentElement.appendChild(scriptElement).remove();
