# TR4CKER BY TAKATAK

**Live delivery tracking for TAKATAK websites — built, operated and managed 100% in-house by TAKATAK.**

No third-party company. No external tracking vendor. We build the application, we run the operations, we manage everything ourselves, on top of the **TAKATAK V1 dashboard** and the **takatak.ca** website platform.

## What it does

TR4CKER tells the customer where their order is — for real:

- The driver carries a **company cell phone** with the TAKATAK application **already installed and authorized**.
- The app uses the **phone's location** (authorized once, on our own company device for drivers; the customer authorizes in the TAKATAK app/website on their side).
- When the driver **leaves the store**, the event fires: the customer's order page switches to "on its way" with live tracking — **Track my order**.
- Events and positions flow by API/messages into the client's website (built by TAKATAK) and the TAKATAK V1 dashboard, where we see and manage every delivery.

## How it's sold

- A **Clover Marketplace (Clover App Market) add-on**, **$50/month** (the standard TAKATAK suite price).
- Offered only to clients who have **a website with TAKATAK** AND **the Clover integrations for delivery**.
- Pilot: **pppmtl.com** (our own store first, like every suite product).

## Operations — all in-house

- TAKATAK develops the application (driver app + customer tracking view + dashboard module).
- TAKATAK supplies/configures the driver phones (app installed, location authorized, ready to work).
- TAKATAK operates the service: onboarding, support, updates — clients never deal with another company.
- Everything connects by API/webhooks (Clover orders ↔ TR4CKER events ↔ website tracking page ↔ V1 dashboard).

## Architecture rules (TAKATAK law)

- Think separate, connect by API/messages: TR4CKER is its own product/app, integrated — never merged — with the websites, Clover and the V1 dashboard.
- Master → Brand → Group → Store structure applies: tracking is configured per brand and per store under the one master account.
- No secrets in git: Clover keys and credentials live in server environment variables / the secure vault only.

## Status

- 2026-10-27: product defined by the owner (Matt, TAKATAK). Development brief: see GitHub issue nº 17 in `takatakca/pppmtl` (pilot) — this repo is the product's home.
