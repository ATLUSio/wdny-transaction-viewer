# Intro
There isn't a transaction history section in the wdny.io shop, so it's difficult to check on previous transactions.  
This extension is meant to give you access to that information. I made it for myself, so I'm sure there's at least one other person who wants something like this.

## What is it doing?
This extension is automating the process of checking your browser's local storage values. When you make a purchase in the wdny.io shop, your payment details are retained in the brwoser's storage.  
This extension is reading the local storage on that page and it looks for wdny.io shop "payment intents". For each payment intent the extension finds, it creates a row with some basic data.

# Installation Instructions

1. Clone the repo
2. Unzip it or w/e
3. Go to chrome dev tools
4. Add the extension
5. Add the extension as an "unpacked extension"
6. Go to https://shop.wdny.io/<any_brand>/process
7. Open the extension
