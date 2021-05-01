
// make a request to the backend for the most recent payment intent
let payload = {
    action: "getRecentPaymentIntent"
}
chrome.runtime.sendMessage(payload, (intent) => {
    // set local storage
    window.localStorage.setItem('recent_payment_intent', intent);
    // reload the page
    location.reload();
})
