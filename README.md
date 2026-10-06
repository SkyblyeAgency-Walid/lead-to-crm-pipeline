# Lead-to-CRM Pipeline

**Google Sheets + Apps Script + HubSpot** - a complete lead cleaning and CRM
sync system that runs entirely inside a spreadsheet.

Turns raw leads from 3 sources (website forms, Meta/Facebook lead ads,
purchased contact lists) into clean, scored, deduplicated HubSpot contacts -
with human review for uncertain cases and a full audit trail. Nothing is ever
deleted; every lead ends up somewhere with a reason.

## Pipeline overview

    Raw JSON leads (3 sources)
            |
    [1] EXTRACT       parse raw JSON -> clean columns
            |
    [2] TRANSFER      Engine staging sheet, Lead IDs "Leads-0001..."
            |
    [3] NORMALIZE     Title Case names | lowercase emails | +CC phones
            |
    [4] SCORE         validate + accuracy signals -> 0-100 quality
            |         dedupe (email + phone fingerprints)
            |
    [5] ROUTE
      |-- Accept (>=70)  --> Validated --> [6] HubSpot sync (auto)
      |-- Flag  (40-69)  --> Review queue --> human Approve / Reject
      `-- Reject (<40)   --> Archived rejected (recoverable, with reasons)

## Features

- Multi-format JSON extraction: web forms, Meta `field_data`, vendor lists, badge scans
- Name / Email / Phone normalization - phones to international +CC format (200+ country codes)
- 0-100 quality scoring with a fully configurable deduction rules table
- Duplicate detection (email +tag/dots policy + phone fingerprint)
- Purchased-list trust rule: stricter validation for bought data
- Bot detection via form user-agent
- Human review queue (Approve/Reject) plus recovery workflow from archive
- HubSpot sync: search-before-create, retry with backoff, full attempt logging
- Self-installing: one click creates all 8 sheets, headers and dropdowns
- One-click menu operation - every stage re-run safe

## How leads flow

| Outcome        | Destination        | Next step                       |
|----------------|--------------------|---------------------------------|
| Accept (>=70)  | Validated          | Auto-sync to HubSpot            |
| Flag (40-69)   | Review queue       | Human decides Approve / Reject  |
| Reject (<40)   | Archived rejected  | Recoverable, reason recorded    |
| Duplicate      | Review queue       | Blocked from double CRM entry   |
| Bad JSON       | Source "Error"     | Reason in Error msg column      |

Every HubSpot attempt is logged in **Sync Logs** (endpoint, HTTP status,
success, error message).

## Requirements

- Google account (Sheets + Apps Script)
- HubSpot account - Free tier works
- 10 minutes for first-time setup

## Quick start

1. **Make a copy** of the master spreadsheet (link provided by the author).
2. The menu **"Lead -> CRM Pipeline"** appears on open. Click
   **Install / Repair structure** - it creates all 8 sheets, headers,
   formatting and dropdowns.
3. In HubSpot: **Settings -> Integrations -> Private Apps -> Create private app**
   - Scopes: `crm.objects.contacts.read` + `crm.objects.contacts.write`
   - Copy the Access Token (shown once, starts with `pat-`)
4. In the spreadsheet copy: **Extensions -> Apps Script -> Project Settings ->
   Script Properties** -> add property `HUBSPOT_TOKEN` = your token.
   (The token lives in Script Properties, never in code.)
5. In HubSpot create 5 custom **Contact properties** (single-line text):
   `lead_id`, `lead_uid`, `lead_source`, `lead_quality`, `lead_note`
6. Optional demo: menu -> **Generate demo data**, then run menu items
   1 -> 6 top to bottom and watch leads flow end to end.

## Demo flow (what you will see)

Extract marks rows "Extracted" -> Transfer creates `Leads-0001...` in Engine ->
Normalize titles the names, lowercases emails, converts phones to +212/+33/+
44 formats -> Engine Pipeline routes one Accepted, one Duplicate to Review
queue, one role-email flag, one reject -> HubSpot Sync creates the contact and
writes the CRM record ID back to Validated. Sync Logs fills empty column A rows.

## Project structure

    00-07  Settings     sheets -> columns -> per-stage settings (all rules)
    08     Installer    one-click sheet/structure setup
    09     Helpers      shared batch read/write utilities (single copy)
    10-12  Extraction   one function per source (Website / Meta / List Upload)
    13     Transfer     3 sources -> Engine, Lead ID generation, gap-fill
    14     Normalization name / email / phone cleaning
    15     Engine       validate -> score -> dedupe -> disposition -> route
    16-17  Review       human decisions + recovery from archive
    18     HubSpot      CRM sync + Sync Logs gap-fill writing
    19     Demo         demo data generator
    99     Menu         spreadsheet menu for one-click operation

## Security notes

- The HubSpot token is stored in **Script Properties** (per-copy, per-user) -
  never hardcoded in source.
- No spreadsheet IDs or secrets exist in the repository.
- `.clasp.json` (local deployment config) is git-ignored.

<!-- Optional screenshots:
![Menu](screenshots/01-menu.png)
![Engine](screenshots/02-engine.png)
-->

## License

MIT - see LICENSE file.
