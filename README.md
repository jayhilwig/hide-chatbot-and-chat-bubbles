# Hide Chatbot & Chat Bubbles

A simple Chrome extension that hides annoying lower-right chatbot, chat bot, and support chat bubbles across websites.

The goal is not to block ads, cookie banners, page content, feedback tabs, QR prompts, form controls, or full chat apps. It only targets floating chat/support widgets that usually sit in the lower-right corner of a webpage.

## What it does

* Hides lower-right chatbot and support chat bubbles
* Shows a red toolbar icon when a chat bubble was found and hidden
* Shows a gray toolbar icon when no chat bubble is detected or blocking is disabled
* Lets you disable blocking on the current site
* Lets you disable blocking everywhere
* Stores preferences using Chrome storage
* Requires no account

## Why this exists

A lot of websites now load persistent chat widgets, support bubbles, AI assistants, and messenger-style launchers. These are often useful sometimes, but they can also cover page content, distract from reading, or keep reappearing after being closed.

This extension is for people who prefer a quieter web experience.

## Compatibility

This extension has been tested against common chatbot and support chat providers, including:

* Intercom / Fin
* Zendesk
* Crisp
* Tawk.to
* Freshworks / Freshchat-style widgets
* HubSpot
* Gorgias
* Kustomer
* Zoho SalesIQ / ZSIQ
* Qualified
* NinjaOne / Qualified-style messenger widgets

It has also been tested across real-world SaaS, ecommerce, travel, food delivery, healthcare, and customer support websites.

Chat widgets are temperamental. They are often loaded by third-party scripts, delayed after page load, injected through iframes or shadow DOM, and changed frequently by vendors. Some sites may not be detected perfectly.

If a site does not work as expected, blocking can be disabled for that site from the extension popup.

## Privacy

This extension does not collect, sell, or share personal data.

It does not require an account.

Site preferences are stored using Chrome storage so the extension can remember whether blocking is enabled or disabled globally or for a specific site.

## Project status

This project is currently private and under active development.

The extension is being tested against common chat widget providers and real-world websites before any broader release.

## Notes

This project is not affiliated with, endorsed by, or sponsored by any chatbot, support, ecommerce, travel, SaaS, or messaging provider mentioned in this README.
