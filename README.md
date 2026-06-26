# Hide Chatbot & Chat Bubbles

A simple Chrome extension that hides annoying lower-right chatbot, chat bot, and support chat bubbles across websites.

The goal is not to block ads, cookie banners, newsletter modals, feedback tabs, QR prompts, form controls, checkout flows, or full chat apps. It only targets floating chat/support widgets that usually sit in the lower-right corner of a webpage.

## What it does

- Hides lower-right chatbot and support chat bubbles
- Shows a red toolbar icon when a chat bubble was found and hidden
- Shows a gray toolbar icon when no chat bubble is detected or blocking is disabled
- Lets you disable blocking on the current site
- Lets you disable blocking everywhere
- Stores preferences using Chrome storage
- Requires no account

## What it does not do

- Does not block ads
- Does not block cookie consent popups
- Does not block newsletter or marketing modals
- Does not block feedback tabs or surveys
- Does not block QR-code prompts or app-download prompts
- Does not block normal forms, checkout flows, or page content

## Why this exists

A lot of websites now load persistent chat widgets, support bubbles, AI assistants, and messenger-style launchers. These are often useful sometimes, but they can also cover page content, distract from reading, or keep reappearing after being closed.

This extension is for people who prefer a quieter web experience.

## Compatibility

This extension has been tested against common chatbot and support chat providers, including:

- LivePerson / LiveEngage
- Front Chat
- Tidio
- LiveChat
- Re:amaze
- Chaty / Chaty.app / Chaty.ai
- Joinchat
- Olark
- Help Scout
- Lifelink chatbot
- UJET
- Vision Helpdesk
- Grace / Healthcare Smart Assistant
- Hyundai SmartChat
- Paradox / recruiting chatbot-style widgets
- BotLauncher-style embedded chat widgets

It has also been tested across real-world SaaS, ecommerce, travel, food delivery, healthcare, and customer support websites.

Chat widgets are temperamental. They are often loaded by third-party scripts, delayed after page load, injected through iframes or shadow DOM, and changed frequently by vendors. Some sites may not be detected perfectly.

If a site does not work as expected, blocking can be disabled for that site from the extension popup.

## Privacy

This extension does not collect, sell, or share personal data.

It does not require an account.

It does not send browsing activity, page content, or preferences to any external server.

Site preferences are stored using Chrome storage so the extension can remember whether blocking is enabled or disabled globally or for a specific site.

## Project status

This project is under active development.

The extension is being tested against common chat widget providers and real-world websites. It is intentionally conservative: it may miss some custom widgets in order to avoid hiding normal page content or important controls.

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

This project is not affiliated with, endorsed by, or sponsored by any chatbot, support, ecommerce, travel, SaaS, or messaging provider mentioned in this README.

