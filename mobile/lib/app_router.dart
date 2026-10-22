import 'package:go_router/go_router.dart';

import 'features/clients/client_list_page.dart';
import 'features/dashboard/dashboard_page.dart';
import 'features/expenses/expense_detail_page.dart';
import 'features/expenses/expense_editor_page.dart';
import 'features/expenses/expense_list_page.dart';
import 'features/invoices/invoice_detail_page.dart';
import 'features/invoices/invoice_editor_page.dart';
import 'features/invoices/invoice_list_page.dart';
import 'features/more/more_page.dart';
import 'features/receipts/receipt_detail_page.dart';
import 'features/receipts/receipt_editor_page.dart';
import 'features/receipts/receipt_list_page.dart';
import 'features/receipts/receipt_upload_page.dart';
import 'features/reports/reports_page.dart';
import 'features/settings/settings_page.dart';
import 'features/shell/app_shell.dart';

GoRouter createRouter() {
  return GoRouter(
    initialLocation: '/',
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/', builder: (context, state) => const DashboardPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/invoices', builder: (context, state) => const InvoiceListPage()),
            GoRoute(path: '/invoices/new', builder: (context, state) => const InvoiceEditorPage()),
            GoRoute(
              path: '/invoices/:id',
              builder: (context, state) => InvoiceDetailPage(id: state.pathParameters['id']!),
            ),
            GoRoute(
              path: '/invoices/:id/edit',
              builder: (context, state) => InvoiceEditorPage(id: state.pathParameters['id']),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/expenses', builder: (context, state) => const ExpenseListPage()),
            GoRoute(path: '/expenses/new', builder: (context, state) => const ExpenseEditorPage()),
            GoRoute(
              path: '/expenses/:id',
              builder: (context, state) => ExpenseDetailPage(id: state.pathParameters['id']!),
            ),
            GoRoute(
              path: '/expenses/:id/edit',
              builder: (context, state) => ExpenseEditorPage(id: state.pathParameters['id']),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/receipts', builder: (context, state) => const ReceiptListPage()),
            GoRoute(path: '/receipts/new', builder: (context, state) => const ReceiptEditorPage()),
            GoRoute(path: '/receipts/upload', builder: (context, state) => const ReceiptUploadPage()),
            GoRoute(
              path: '/receipts/:id',
              builder: (context, state) => ReceiptDetailPage(id: state.pathParameters['id']!),
            ),
            GoRoute(
              path: '/receipts/:id/edit',
              builder: (context, state) => ReceiptEditorPage(id: state.pathParameters['id']),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/more', builder: (context, state) => const MorePage()),
            GoRoute(path: '/clients', builder: (context, state) => const ClientListPage()),
            GoRoute(path: '/reports', builder: (context, state) => const ReportsPage()),
            GoRoute(path: '/settings', builder: (context, state) => const SettingsPage()),
          ]),
        ],
      ),
    ],
  );
}
