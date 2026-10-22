import 'package:flutter/foundation.dart';
import 'package:sembast/sembast.dart';

import '../core/ids.dart';
import 'database.dart';
import 'models.dart';

class LedgerStore extends ChangeNotifier {
  LedgerStore({Database? database}) : _injected = database;

  final Database? _injected;
  Database? _db;

  bool ready = false;
  String? error;

  BusinessProfile profile = const BusinessProfile();
  List<Client> clients = [];
  List<Invoice> invoices = [];
  List<Expense> expenses = [];
  List<Receipt> receipts = [];

  final _clients = stringMapStoreFactory.store('clients');
  final _invoices = stringMapStoreFactory.store('invoices');
  final _expenses = stringMapStoreFactory.store('expenses');
  final _receipts = stringMapStoreFactory.store('receipts');
  final _files = stringMapStoreFactory.store('files');
  final _meta = stringMapStoreFactory.store('meta');

  Database get db {
    final d = _db;
    if (d == null) {
      throw StateError('LedgerStore has not been initialized');
    }
    return d;
  }

  Future<void> init() async {
    try {
      _db = _injected ?? await openLedgerDatabase();
      await reload();
      ready = true;
      error = null;
    } catch (e) {
      error = e.toString();
      ready = false;
    }
    notifyListeners();
  }

  Future<void> reload() async {
    final d = db;
    final profileMap = await _meta.record('profile').get(d);
    profile = BusinessProfile.fromJson(profileMap);

    clients = (await _clients.find(d, finder: Finder(sortOrders: [SortOrder('name')])))
        .map((r) => Client.fromJson(Map<String, dynamic>.from(r.value)))
        .toList();

    invoices = (await _invoices.find(d, finder: Finder(sortOrders: [SortOrder('createdAt', false)])))
        .map((r) => Invoice.fromJson(Map<String, dynamic>.from(r.value)))
        .toList();

    expenses = (await _expenses.find(d, finder: Finder(sortOrders: [SortOrder('createdAt', false)])))
        .map((r) => Expense.fromJson(Map<String, dynamic>.from(r.value)))
        .toList();

    receipts = (await _receipts.find(d, finder: Finder(sortOrders: [SortOrder('createdAt', false)])))
        .map((r) => Receipt.fromJson(Map<String, dynamic>.from(r.value)))
        .toList();

    notifyListeners();
  }

  Future<void> saveProfile(BusinessProfile next) async {
    profile = next;
    await _meta.record('profile').put(db, next.toJson());
    notifyListeners();
  }

  Future<String> peekNumber(String prefix) async {
    final period = monthPeriod();
    final key = 'seq-$prefix-$period';
    final current = (await _meta.record(key).get(db))?['value'] as int? ?? 0;
    return '$prefix-$period-${(current + 1).toString().padLeft(4, '0')}';
  }

  Future<String> takeNumber(String prefix) async {
    final period = monthPeriod();
    final key = 'seq-$prefix-$period';
    final current = (await _meta.record(key).get(db))?['value'] as int? ?? 0;
    final next = current + 1;
    await _meta.record(key).put(db, {'value': next});
    return '$prefix-$period-${next.toString().padLeft(4, '0')}';
  }

  Future<void> saveClient(Client client) async {
    await _clients.record(client.id).put(db, client.toJson());
    await reload();
  }

  Future<void> deleteClient(String id) async {
    await _clients.record(id).delete(db);
    await reload();
  }

  Client? clientById(String? id) {
    if (id == null) return null;
    for (final c in clients) {
      if (c.id == id) return c;
    }
    return null;
  }

  Future<void> saveInvoice(Invoice invoice, {bool consumeNumber = false}) async {
    if (consumeNumber) {
      await takeNumber('INV');
    }
    await _invoices.record(invoice.id).put(db, invoice.toJson());
    await reload();
  }

  Future<void> deleteInvoice(String id) async {
    await _invoices.record(id).delete(db);
    await reload();
  }

  Invoice? invoiceById(String id) {
    for (final i in invoices) {
      if (i.id == id) return i;
    }
    return null;
  }

  Future<void> saveExpense(Expense expense, {StoredFile? file}) async {
    final d = db;
    await d.transaction((txn) async {
      await _expenses.record(expense.id).put(txn, expense.toJson());
      if (file != null) {
        await _files.record(expense.id).put(txn, {
          'name': file.name,
          'mime': file.mime,
          'bytes': file.bytes,
        });
      }
    });
    await reload();
  }

  Future<void> deleteExpense(String id) async {
    final d = db;
    await d.transaction((txn) async {
      await _expenses.record(id).delete(txn);
      await _files.record(id).delete(txn);
    });
    await reload();
  }

  Expense? expenseById(String id) {
    for (final e in expenses) {
      if (e.id == id) return e;
    }
    return null;
  }

  Future<void> saveReceipt(Receipt receipt, {StoredFile? file, bool consumeNumber = false}) async {
    final d = db;
    await d.transaction((txn) async {
      if (consumeNumber) {
        final period = monthPeriod();
        final key = 'seq-RCPT-$period';
        final current = (await _meta.record(key).get(txn))?['value'] as int? ?? 0;
        await _meta.record(key).put(txn, {'value': current + 1});
      }
      await _receipts.record(receipt.id).put(txn, receipt.toJson());
      if (file != null) {
        await _files.record(receipt.id).put(txn, {
          'name': file.name,
          'mime': file.mime,
          'bytes': file.bytes,
        });
      }
    });
    await reload();
  }

  Future<void> deleteReceipt(String id) async {
    final d = db;
    await d.transaction((txn) async {
      await _receipts.record(id).delete(txn);
      await _files.record(id).delete(txn);
    });
    await reload();
  }

  Receipt? receiptById(String id) {
    for (final r in receipts) {
      if (r.id == id) return r;
    }
    return null;
  }

  Future<StoredFile?> getFile(String id) async {
    final row = await _files.record(id).get(db);
    if (row == null) return null;
    final bytes = row['bytes'];
    if (bytes is! List) return null;
    return StoredFile(
      bytes: List<int>.from(bytes),
      name: row['name'] as String? ?? 'file',
      mime: row['mime'] as String? ?? 'application/octet-stream',
    );
  }

  Future<Receipt> markInvoicePaid(Invoice invoice, {PaymentMethod? method}) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final paid = invoice.copyWith(
      status: InvoiceStatus.paid,
      amountPaid: invoice.total,
      paidAt: todayIso(),
      updatedAt: now,
      data: invoice.data.copyWith(paymentMethod: method ?? invoice.data.paymentMethod),
    );
    await saveInvoice(paid);

    final number = await peekNumber('RCPT');
    final receiptData = paid.data.copyWith(number: number, date: todayIso());
    final receipt = Receipt(
      id: newId(),
      kind: ReceiptKind.generated,
      title: paid.data.customer.name.isNotEmpty ? paid.data.customer.name : paid.number,
      date: receiptData.date,
      total: paid.total,
      currency: paid.currency,
      category: paid.category,
      data: receiptData,
      invoiceId: paid.id,
      createdAt: now,
      updatedAt: now,
    );
    await saveReceipt(receipt, consumeNumber: true);
    return receipt;
  }

  DashboardSnapshot get dashboard {
    final month = todayIso().substring(0, 7);
    final monthInvoices = invoices.where((i) => i.date.startsWith(month) && i.effectiveStatus != InvoiceStatus.cancelled);
    final paidThisMonth = invoices.where((i) => i.status == InvoiceStatus.paid && (i.paidAt ?? i.date).startsWith(month));
    final monthExpenses = expenses.where((e) => e.date.startsWith(month));
    final outstanding = invoices.where((i) =>
        i.effectiveStatus == InvoiceStatus.sent || i.effectiveStatus == InvoiceStatus.overdue);

    return DashboardSnapshot(
      invoicedThisMonth: MoneyBag.sum(monthInvoices.map((i) => (i.currency, i.total))),
      collectedThisMonth: MoneyBag.sum(paidThisMonth.map((i) => (i.currency, i.amountPaid))),
      spentThisMonth: MoneyBag.sum(monthExpenses.map((e) => (e.currency, e.amount))),
      outstanding: MoneyBag.sum(outstanding.map((i) => (i.currency, i.balance))),
      overdueCount: invoices.where((i) => i.effectiveStatus == InvoiceStatus.overdue).length,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
      receiptCount: receipts.length,
      clientCount: clients.length,
    );
  }

  List<(String, MoneyBag)> expensesByCategory() {
    final map = <String, List<(Currency, double)>>{};
    for (final e in expenses) {
      final key = e.category.isEmpty ? 'Uncategorized' : e.category;
      map.putIfAbsent(key, () => []).add((e.currency, e.amount));
    }
    final rows = map.entries.map((e) => (e.key, MoneyBag.sum(e.value))).toList()
      ..sort((a, b) => a.$1.compareTo(b.$1));
    return rows;
  }

  List<MonthPoint> lastSixMonths() {
    final now = DateTime.now();
    return List.generate(6, (i) {
      final d = DateTime(now.year, now.month - (5 - i), 1);
      final prefix = '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}';
      final label = '${_monthNames[d.month - 1]} ${d.year}';
      final income = MoneyBag.sum(
        invoices
            .where((inv) => inv.status == InvoiceStatus.paid && (inv.paidAt ?? inv.date).startsWith(prefix))
            .map((inv) => (inv.currency, inv.amountPaid)),
      );
      final spent = MoneyBag.sum(
        expenses.where((e) => e.date.startsWith(prefix)).map((e) => (e.currency, e.amount)),
      );
      return MonthPoint(label: label, prefix: prefix, income: income, expenses: spent);
    });
  }

  Future<void> loadDemo() async {
    final now = DateTime.now().millisecondsSinceEpoch;
    profile = const BusinessProfile(
      name: 'Al-Madina Traders',
      phone: '0300-1234567',
      email: 'hello@almadina.pk',
      address: 'Main Bazaar, Lahore',
      taxId: 'NTN-1234567-8',
      defaultCurrency: Currency.pkr,
      defaultTaxPercent: 0,
    );
    await _meta.record('profile').put(db, profile.toJson());

    final ahmed = Client(
      id: newId(),
      name: 'Ahmed Ali',
      phone: '0321-5550101',
      address: 'Gulberg, Lahore',
      createdAt: now,
      updatedAt: now,
    );
    final sana = Client(
      id: newId(),
      name: 'Sana Malik',
      phone: '0333-4442211',
      email: 'sana@example.com',
      address: 'DHA Phase 5, Karachi',
      createdAt: now,
      updatedAt: now,
    );
    await _clients.record(ahmed.id).put(db, ahmed.toJson());
    await _clients.record(sana.id).put(db, sana.toJson());

    final invNumber = await peekNumber('INV');
    final invoice = Invoice(
      id: newId(),
      number: invNumber,
      clientId: ahmed.id,
      status: InvoiceStatus.sent,
      category: 'Services',
      data: DocumentData(
        number: invNumber,
        date: todayIso(),
        dueDate: dueInDays(7),
        vendor: profile.asParty,
        customer: ahmed.asParty,
        items: [
          LineItem(id: newId(), description: 'Website maintenance (monthly)', quantity: 1, unitPrice: 25000),
          LineItem(id: newId(), description: 'Domain renewal', quantity: 1, unitPrice: 4500),
        ],
        taxPercent: 0,
        notes: 'Payable via bank transfer or JazzCash.',
      ),
      createdAt: now,
      updatedAt: now,
    );
    await saveInvoice(invoice, consumeNumber: true);

    await saveExpense(
      Expense(
        id: newId(),
        vendor: 'Shell Petrol Pump',
        date: todayIso(),
        amount: 8500,
        currency: Currency.pkr,
        category: 'Fuel',
        paymentMethod: PaymentMethod.card,
        notes: 'Delivery van refill',
        createdAt: now,
        updatedAt: now,
      ),
    );
    await saveExpense(
      Expense(
        id: newId(),
        vendor: 'PTCL',
        date: todayIso(),
        amount: 3200,
        currency: Currency.pkr,
        category: 'Utilities',
        paymentMethod: PaymentMethod.bankTransfer,
        createdAt: now,
        updatedAt: now,
      ),
    );
  }

  Future<void> clearAll() async {
    await db.transaction((txn) async {
      await _clients.delete(txn);
      await _invoices.delete(txn);
      await _expenses.delete(txn);
      await _receipts.delete(txn);
      await _files.delete(txn);
      await _meta.delete(txn);
    });
    await reload();
  }
}

class DashboardSnapshot {
  const DashboardSnapshot({
    required this.invoicedThisMonth,
    required this.collectedThisMonth,
    required this.spentThisMonth,
    required this.outstanding,
    required this.overdueCount,
    required this.invoiceCount,
    required this.expenseCount,
    required this.receiptCount,
    required this.clientCount,
  });

  final MoneyBag invoicedThisMonth;
  final MoneyBag collectedThisMonth;
  final MoneyBag spentThisMonth;
  final MoneyBag outstanding;
  final int overdueCount;
  final int invoiceCount;
  final int expenseCount;
  final int receiptCount;
  final int clientCount;
}

class MonthPoint {
  const MonthPoint({
    required this.label,
    required this.prefix,
    required this.income,
    required this.expenses,
  });

  final String label;
  final String prefix;
  final MoneyBag income;
  final MoneyBag expenses;
}

const _monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
