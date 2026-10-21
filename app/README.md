# Raseed (Flutter)

Invoicing and expense management for Android, iOS, and web. This app sits in `app/` next to the original Next.js ledger and ports that receipt workflow into a full books product.

## What it covers

- **Invoices** — drafts, sent, paid, overdue; clients; tax, discount, due dates; PDF share/print
- **Expenses** — categories, payment methods, camera/file attachments
- **Receipts** — generate digital slips (English/Urdu, PKR/USD/GBP, six templates from the web app) or upload photos/PDFs
- **Clients & reports** — saved bill-to parties, monthly collected vs spent, spend by category
- **Local ledger** — Sembast database on device (IndexedDB on web), same privacy model as the browser app

Marking an invoice paid creates a generated receipt automatically.

## Run

```bash
cd app
flutter pub get
flutter test
flutter run
```

Web:

```bash
flutter run -d chrome
```

## Templates

Classic, Modern, Bold, Elegant, Cash Memo, and Thermal (80 mm) match the layouts in the Next.js app (`src/components/receipt-templates`).
