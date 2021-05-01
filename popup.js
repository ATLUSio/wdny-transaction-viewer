// Initialize button with user's preferred color
let refreshButton = document.getElementById("refreshButton"),
    rpiDiv = document.getElementById("rpiDiv"),
    txDiv = document.getElementById("txDiv"),
    optDiv = document.getElementById("optDiv"),
    sortDiv = document.getElementById("sortDiv");

let transactions = [],
    recentPI,
    clickEvent,
    lastTab,
    collectionList = [],
    selectedCollection = "all",
    sortDescending = true;

function makeElement(el, cls=null) {
    let _div = document.createElement(el);
    if (cls !== null) {
        _div.classList.add(cls);
    }
    return _div;
}

function makeDiv(cls) {
    return makeElement("div", cls)
}

function makeSpan(text) {
    let _span = document.createElement("span");
    _span.innerText = text;
    return _span;
}

function breakElement() {
    return document.createElement("br");
}

function getMetadata(tx) {
    let metadata = tx.metadata;
    if (!metadata) {
        return {}
    }

    return metadata
}

function getAmount(tx) {
    let amount = parseInt(tx.amount) ? tx.amount/100 : 0
    return `Amount: ${amount} ${tx.currency}  `;
}

function getCollection(tx, valueOnly=false) {
    let collection = getMetadata(tx).collection || "unknown"
    if (valueOnly) {
        return collection
    }
    return `Collection: ${collection}`;
}

function getAccount(tx) {
    let amount = getMetadata(tx).accountName || "unknown";
    return `Account: ${amount}`;
}

function getStatus(tx) {
    return `Status: ${tx.status}`;
}

function getCharge(tx) {
    let charges = tx.charges.data;
    return charges[0];
}

function getRefundedAmount(tx) {
    let charge = getCharge(tx);
    if (!charge) return 0;

    return charge.amount_refunded;
}

function getReceiptUrl(tx) {
    let charge = getCharge(tx);
    if (!charge) return "";
    return charge.receipt_url;
}

function getDate(tx) {
    let _date = new Date(tx.created*1000);
    return _date;
}

function getCancelDate(tx) {
    let _date = new Date(tx.canceled_at*1000);
    return _date;
}

function MakeTransactionElement(tx) {

    // top div
    let _transactionDiv = makeDiv("transaction");

    let _stateColorDiv = makeDiv("stateColor");
    _stateColorDiv.classList.add(
        tx.status === "succeeded"
            ? "success"
            : "failed"
    )
    _transactionDiv.appendChild(_stateColorDiv);

    let _transactionContentDiv = makeDiv("transactionContent");

    let _idHeaderDiv = makeDiv("idHeader");
    let _txSpan = makeElement("span");
    _txSpan.innerText = "Tx: " + tx.id;
    _idHeaderDiv.appendChild(_txSpan);

    
    let _setButton = makeElement("button", "setButton");
    _setButton.id = tx.id;
    _setButton.innerText = "Set Active";
    if (recentPI.includes(tx.id)) {
        _setButton.disabled = true;
    }
    _idHeaderDiv.appendChild(_setButton);

    _idHeaderDiv.appendChild(makeDiv("idDivider"));
    _transactionContentDiv.appendChild(_idHeaderDiv);

    let _panelsDiv = makeDiv("panels");

    // left panel information
    let _leftPanel = makeDiv("leftPanel");
    let _amountSpan = makeSpan(getAmount(tx));
    let _receiptAnchor = makeElement("a")
    _receiptAnchor.innerText = "(Receipt)";
    _receiptAnchor.href = getReceiptUrl(tx);
    _receiptAnchor.target = "_blank";
    _amountSpan.appendChild(_receiptAnchor);
    _leftPanel.appendChild(_amountSpan);
    // _leftPanel.appendChild(makeSpan(getAmount(tx)))
    _leftPanel.appendChild(breakElement());
    _leftPanel.appendChild(makeSpan(getCollection(tx)))
    _leftPanel.appendChild(breakElement());
    _leftPanel.appendChild(makeSpan(getAccount(tx)))
    _leftPanel.appendChild(breakElement());
    _leftPanel.appendChild(makeSpan(getDate(tx)));

    _panelsDiv.appendChild(_leftPanel);

    // right panel information
    let _rightPanel = makeDiv("rightPanel");
    let _statusSpan = makeSpan(getStatus(tx));
    _rightPanel.appendChild(_statusSpan)
    _rightPanel.appendChild(breakElement());
    let refunded = getRefundedAmount(tx);
    let refundedBoolText = "Refunded? ";
    refundedBoolText += refunded ? "True" : "False"
    _rightPanel.appendChild(makeSpan(refundedBoolText));
    _rightPanel.appendChild(breakElement());
    _rightPanel.appendChild(makeSpan(`Refunded Amount: ${refunded/100} ${tx.currency}`));
    _rightPanel.appendChild(breakElement());
    _rightPanel.appendChild(makeSpan(getCancelDate(tx)));
    
    _panelsDiv.appendChild(_rightPanel);
    _transactionContentDiv.appendChild(_panelsDiv);

    _transactionDiv.appendChild(_transactionContentDiv);
    return _transactionDiv;
}

function UpdateFilter() {
    let _selectElem = document.createElement("select");
    _selectElem.id = "collection-select";
    collectionList.forEach(col => {
        let _colElem = document.createElement("option");
        _colElem.value = col;
        _colElem.innerText = col;
        _selectElem.appendChild(_colElem);
    });
    let _holdingSpan = document.createElement("span");
    let _labelSpan = document.createElement("span");
    _labelSpan.innerText = "Collection: ";
    _holdingSpan.appendChild(_labelSpan);
    _holdingSpan.appendChild(_selectElem);
    optDiv.innerHTML = _holdingSpan.outerHTML;
}

function RenderTransactions() {
    transactions.sort( (a,b) => {
        if (sortDescending)
            return b.created - a.created

        return a.created - b.created;
    });

    rpiDiv.innerHTML = recentPI;

    let _collectionList = [];
    _collectionList.push("all");
    let txItems = document.createElement('div');
    txItems.appendChild(document.createElement('br'));
    transactions.forEach(tx => {
        let _txItem = MakeTransactionElement(tx);
        txItems.appendChild(_txItem);
        txItems.appendChild(breakElement());

        // keep track of unique collections so we can filter for specific collections
        let collection = getCollection(tx, true);
        if (!_collectionList.includes(collection))
            _collectionList.push(collection);
    });
    // overwrite
    collectionList = _collectionList;

    // update the innerHTML w/ HTML representing the transactions
    // rendered in w/ data in rows
    txDiv.innerHTML = txItems.outerHTML;

    UpdateFilter();
}

async function doGetTransactions() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    lastTab = tab.id;
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["functions/getTransactions.js"]
    });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");

        if (request.action === "getTransactions") {
            recentPI = "Most&nbsp;Recent&nbsp;Transaction: " + request.recentPI;
            transactions = request.transactions;
            RenderTransactions();
        }

        if (request.action === "renderTransactions") {
            RenderTransactions();
        }

        if (request.action === "getClickEvent") {
            sendResponse({
                ...request,
                event: clickEvent
            })
        }

        if (request.action === "getCollection") {
            sendResponse({
                ...request,
                collection: selectedCollection
            })
        }

        if (request.action === "updateRecentPaymentIntent") {
            rpiDiv.innerHTML = idPressed;
        }

        if (request.action === "getRecentPaymentIntent") {
            sendResponse(idPressed);
        }

    }
);

sortDiv.addEventListener('click', async () => {
    // toggle otherway around
    sortDescending = !sortDescending;
    // text represents the opposite optoin
    let text = sortDescending ? "Ascending" : "Descending";
    sortDiv.innerText = "Sort " + text;

    // update old school local storage
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
            let  responsePayload = {
                action: "renderTransactions"
            };
        
            chrome.runtime.sendMessage(responsePayload);
        }
    });
})

setInterval(() => {
    let buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (!btn.hasListener) {
            btn.addEventListener('click', async () => {
                if (btn.id.includes("pi_")) {

                    // update the global
                    idPressed = btn.id;
                    // update the html
                    rpiDiv.innerHTML = "Most&nbsp;Recent&nbsp;Transaction: " + btn.id;
                    // update the local storage
                    chrome.storage.sync.set({'recent_payment_intent': btn.id});

                    // update old school local storage
                    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ["functions/updateLocalStorage.js"]
                    });

                    setTimeout(() => {
                        doGetTransactions();
                    }, 250);
                }
            })
            btn.hasListener = true;
        }
    });

    // let collectionSelect = document.getElementById('collection-select');
    // if (collectionSelect && !collectionSelect.hasListener) {
    //     collectionSelect.addEventListener('change', async (changed) => {

    //         selectedCollection = changed;
    //         // update old school local storage
    //         let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    //         chrome.scripting.executeScript({
    //             target: { tabId: tab.id },
    //             // files: ["functions/updateLocalStorage.js"]
    //             function: () => {
    //                 let  responsePayload = {
    //                     action: "getCollection"
    //                 };
                
    //                 chrome.runtime.sendMessage(responsePayload, collection => console.log(collection));
    //             }
    //         });
    //     })
    // }
}, 1000);

refreshButton.addEventListener('click', doGetTransactions);

// When the popup is opened, get the transactions from local storage
(async () => {
    doGetTransactions();
    // let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // lastTab = tab.id;
    // chrome.scripting.executeScript({
    //     target: { tabId: tab.id },
    //     files: ["functions/getTransactions.js"]
    // });
})()
