# Hide Chatbot & Chat Bubbles

A simple Chrome extension that hides annoying lower-right chatbot, chat bot, and support chat bubbles across websites.

The goal is not to block ads, cookie banners, page content, or full chat apps. It only targets floating chat/support widgets that usually sit in the lower-right corner of a webpage.

## What it does

- Hides lower-right chatbot and support chat bubbles
- Shows a red toolbar icon when a chat bubble was found and hidden
- Shows a gray toolbar icon when no chat bubble is detected or blocking is disabled
- Lets you disable blocking on the current site
- Lets you disable blocking everywhere
- Stores preferences using Chrome storage
- Requires no account

## Why this exists

A lot of websites now load persistent chat widgets, support bubbles, AI assistants, and messenger-style launchers. These are often useful sometimes, but they can also cover page content, distract from reading, or keep reappearing after being closed.

This extension is for people who prefer a quieter web experience.

## Compatibility

This extension has been tested across 20+ websites using common chatbot and support chat providers, including SaaS, ecommerce, travel, food delivery, and customer support sites.

Chat widgets are temperamental. They are often loaded by third-party scripts, delayed after page load, injected through iframes, or changed frequently by vendors. Some sites may not be detected perfectly.

If a site does not work as expected, you can disable blocking for that site from the extension popup.

## Privacy

This extension does not collect, sell, or share personal data.

It does not require an account.

Site preferences are stored using Chrome storage so the extension can remember whether blocking is enabled or disabled globally or for a specific site.

## Public source

The source code for this extension is publicly viewable here:

https://github.com/jayhilwig/hide-chatbot-and-chat-bubbles

Feedback is welcome through GitHub issues.

This project is not currently accepting external code contributions.

## Development

Load the extension locally:

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the project folder

After editing files, reload the extension from `chrome://extensions` and refresh the test page.

## Project structure

```text
background.js
content.js
manifest.json
popup.html
popup.js

icon16.png
icon32.png
icon48.png
icon128.png
