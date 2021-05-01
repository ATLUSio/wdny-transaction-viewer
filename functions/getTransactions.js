
// get transactions from local storage, look for the recent payment intent,
// save that to sync storage
function getTransactions() {
    let transactions = [],
        recentPI,
        ls = window.localStorage;

    // console.log(rpiDiv);
    Object.keys(ls).forEach(key => {
        let obj = ls[key];
        // if this is the recent payment attempt obj, save the value
        if (key === "recent_payment_intent") {
            recentPI = obj;
            // rpiDiv.innerText = obj;
        } else {
            // get objs that are payment intents only
            if (obj.includes("payment_intent")) {
                // parse obj and push it to the transaction list
                transactions.push(JSON.parse(obj))
            }
        }
    })

    let responsePayload = {
        action: "getTransactions",
        recentPI: recentPI,
        transactions: transactions
    };

    // render transactions
    chrome.runtime.sendMessage(responsePayload);

    // set the payment intent in the storage. this allows us to listen for a storage
    // change and update the local storage value
    chrome.storage.sync.set({'recent_payment_intent': recentPI})
}
getTransactions();
