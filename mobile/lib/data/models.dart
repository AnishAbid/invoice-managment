import '../core/ids.dart';
import '../core/money.dart';

enum Currency {
  pkr('PKR'),
  usd('USD'),
  gbp('GBP');

  const Currency(this.code);
  final String code;

  static Currency fromCode(String? code) =>
      Currency.values.firstWhere((c) => c.code == code, orElse: () => Currency.pkr);
}

enum Language {
  en,
  ur;

  static Language fromName(String? name) =>
      name == 'ur' ? Language.ur : Language.en;
}

enum PaymentMethod {
  cash,
  card,
  bankTransfer,
  jazzcash,
  easypaisa,
  cheque,
  other;

  String get key => switch (this) {
        PaymentMethod.bankTransfer => 'bank_transfer',
        _ => name,
      };

  static PaymentMethod fromKey(String? key) => switch (key) {
        'bank_transfer' || 'bankTransfer' => PaymentMethod.bankTransfer,
        'card' => PaymentMethod.card,
        'jazzcash' => PaymentMethod.jazzcash,
        'easypaisa' => PaymentMethod.easypaisa,
        'cheque' => PaymentMethod.cheque,
        'other' => PaymentMethod.other,
        _ => PaymentMethod.cash,
      };
}

enum TemplateId {
  classic,
  thermal,
  modern,
  bold,
  elegant,
  memo;

  static TemplateId fromName(String? name) => TemplateId.values.firstWhere(
        (t) => t.name == name,
        orElse: () => TemplateId.classic,
      );
}

enum PaperSize { a4, thermal }

enum DiscountType {
  percent,
  amount;

  static DiscountType fromName(String? name) =>
      name == 'percent' ? DiscountType.percent : DiscountType.amount;
}

enum InvoiceStatus {
  draft,
  sent,
  paid,
  overdue,
  cancelled;

  static InvoiceStatus fromName(String? name) => InvoiceStatus.values.firstWhere(
        (s) => s.name == name,
        orElse: () => InvoiceStatus.draft,
      );
}

enum ReceiptKind {
  generated,
  uploaded;

  static ReceiptKind fromName(String? name) =>
      name == 'uploaded' ? ReceiptKind.uploaded : ReceiptKind.generated;
}

enum DocKind { invoice, receipt }

class Party {
  const Party({this.name = '', this.phone = '', this.address = '', this.email = ''});

  final String name;
  final String phone;
  final String address;
  final String email;

  Party copyWith({String? name, String? phone, String? address, String? email}) => Party(
        name: name ?? this.name,
        phone: phone ?? this.phone,
        address: address ?? this.address,
        email: email ?? this.email,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'address': address,
        'email': email,
      };

  factory Party.fromJson(Map<String, dynamic>? json) => Party(
        name: json?['name'] as String? ?? '',
        phone: json?['phone'] as String? ?? '',
        address: json?['address'] as String? ?? '',
        email: json?['email'] as String? ?? '',
      );
}

class LineItem {
  const LineItem({
    required this.id,
    this.description = '',
    this.quantity = 1,
    this.unitPrice = 0,
  });

  final String id;
  final String description;
  final double quantity;
  final double unitPrice;

  double get lineTotal => quantity * unitPrice;

  LineItem copyWith({String? description, double? quantity, double? unitPrice}) => LineItem(
        id: id,
        description: description ?? this.description,
        quantity: quantity ?? this.quantity,
        unitPrice: unitPrice ?? this.unitPrice,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'description': description,
        'quantity': quantity,
        'unitPrice': unitPrice,
      };

  factory LineItem.fromJson(Map<String, dynamic> json) => LineItem(
        id: json['id'] as String? ?? newId(),
        description: json['description'] as String? ?? '',
        quantity: (json['quantity'] as num?)?.toDouble() ?? 1,
        unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
      );

  static LineItem blank() => LineItem(id: newId());
}

class Totals {
  const Totals({
    required this.subtotal,
    required this.discount,
    required this.tax,
    required this.total,
  });

  final double subtotal;
  final double discount;
  final double tax;
  final double total;
}

class DocumentData {
  const DocumentData({
    this.number = '',
    this.date = '',
    this.dueDate = '',
    this.vendor = const Party(),
    this.customer = const Party(),
    this.items = const [],
    this.taxPercent = 0,
    this.discountType = DiscountType.amount,
    this.discountValue = 0,
    this.paymentMethod = PaymentMethod.cash,
    this.notes = '',
    this.language = Language.en,
    this.currency = Currency.pkr,
    this.template = TemplateId.classic,
  });

  final String number;
  final String date;
  final String dueDate;
  final Party vendor;
  final Party customer;
  final List<LineItem> items;
  final double taxPercent;
  final DiscountType discountType;
  final double discountValue;
  final PaymentMethod paymentMethod;
  final String notes;
  final Language language;
  final Currency currency;
  final TemplateId template;

  Totals get totals => computeTotals(
        items: items,
        discountType: discountType,
        discountValue: discountValue,
        taxPercent: taxPercent,
      );

  bool get hasContent =>
      vendor.name.trim().isNotEmpty ||
      items.any((i) => i.description.trim().isNotEmpty || i.unitPrice > 0);

  List<LineItem> get filledItems =>
      items.where((i) => i.description.trim().isNotEmpty || i.unitPrice > 0).toList();

  DocumentData copyWith({
    String? number,
    String? date,
    String? dueDate,
    Party? vendor,
    Party? customer,
    List<LineItem>? items,
    double? taxPercent,
    DiscountType? discountType,
    double? discountValue,
    PaymentMethod? paymentMethod,
    String? notes,
    Language? language,
    Currency? currency,
    TemplateId? template,
  }) =>
      DocumentData(
        number: number ?? this.number,
        date: date ?? this.date,
        dueDate: dueDate ?? this.dueDate,
        vendor: vendor ?? this.vendor,
        customer: customer ?? this.customer,
        items: items ?? this.items,
        taxPercent: taxPercent ?? this.taxPercent,
        discountType: discountType ?? this.discountType,
        discountValue: discountValue ?? this.discountValue,
        paymentMethod: paymentMethod ?? this.paymentMethod,
        notes: notes ?? this.notes,
        language: language ?? this.language,
        currency: currency ?? this.currency,
        template: template ?? this.template,
      );

  Map<String, dynamic> toJson() => {
        'number': number,
        'date': date,
        'dueDate': dueDate,
        'vendor': vendor.toJson(),
        'customer': customer.toJson(),
        'items': items.map((i) => i.toJson()).toList(),
        'taxPercent': taxPercent,
        'discountType': discountType.name,
        'discountValue': discountValue,
        'paymentMethod': paymentMethod.key,
        'notes': notes,
        'language': language.name,
        'currency': currency.code,
        'template': template.name,
      };

  factory DocumentData.fromJson(Map<String, dynamic>? json) {
    final itemsJson = json?['items'] as List<dynamic>? ?? const [];
    return DocumentData(
      number: (json?['number'] ?? json?['receiptNumber']) as String? ?? '',
      date: json?['date'] as String? ?? todayIso(),
      dueDate: json?['dueDate'] as String? ?? '',
      vendor: Party.fromJson(json?['vendor'] as Map<String, dynamic>?),
      customer: Party.fromJson(json?['customer'] as Map<String, dynamic>?),
      items: itemsJson.map((e) => LineItem.fromJson(Map<String, dynamic>.from(e as Map))).toList(),
      taxPercent: (json?['taxPercent'] as num?)?.toDouble() ?? 0,
      discountType: DiscountType.fromName(json?['discountType'] as String?),
      discountValue: (json?['discountValue'] as num?)?.toDouble() ?? 0,
      paymentMethod: PaymentMethod.fromKey(json?['paymentMethod'] as String?),
      notes: json?['notes'] as String? ?? '',
      language: Language.fromName(json?['language'] as String?),
      currency: Currency.fromCode(json?['currency'] as String?),
      template: TemplateId.fromName(json?['template'] as String?),
    );
  }
}

class BusinessProfile {
  const BusinessProfile({
    this.name = '',
    this.phone = '',
    this.email = '',
    this.address = '',
    this.taxId = '',
    this.defaultCurrency = Currency.pkr,
    this.defaultLanguage = Language.en,
    this.defaultTemplate = TemplateId.classic,
    this.invoiceDueDays = 14,
    this.defaultTaxPercent = 0,
  });

  final String name;
  final String phone;
  final String email;
  final String address;
  final String taxId;
  final Currency defaultCurrency;
  final Language defaultLanguage;
  final TemplateId defaultTemplate;
  final int invoiceDueDays;
  final double defaultTaxPercent;

  Party get asParty => Party(name: name, phone: phone, address: address, email: email);

  bool get isComplete => name.trim().isNotEmpty;

  BusinessProfile copyWith({
    String? name,
    String? phone,
    String? email,
    String? address,
    String? taxId,
    Currency? defaultCurrency,
    Language? defaultLanguage,
    TemplateId? defaultTemplate,
    int? invoiceDueDays,
    double? defaultTaxPercent,
  }) =>
      BusinessProfile(
        name: name ?? this.name,
        phone: phone ?? this.phone,
        email: email ?? this.email,
        address: address ?? this.address,
        taxId: taxId ?? this.taxId,
        defaultCurrency: defaultCurrency ?? this.defaultCurrency,
        defaultLanguage: defaultLanguage ?? this.defaultLanguage,
        defaultTemplate: defaultTemplate ?? this.defaultTemplate,
        invoiceDueDays: invoiceDueDays ?? this.invoiceDueDays,
        defaultTaxPercent: defaultTaxPercent ?? this.defaultTaxPercent,
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'email': email,
        'address': address,
        'taxId': taxId,
        'defaultCurrency': defaultCurrency.code,
        'defaultLanguage': defaultLanguage.name,
        'defaultTemplate': defaultTemplate.name,
        'invoiceDueDays': invoiceDueDays,
        'defaultTaxPercent': defaultTaxPercent,
      };

  factory BusinessProfile.fromJson(Map<String, dynamic>? json) => BusinessProfile(
        name: json?['name'] as String? ?? '',
        phone: json?['phone'] as String? ?? '',
        email: json?['email'] as String? ?? '',
        address: json?['address'] as String? ?? '',
        taxId: json?['taxId'] as String? ?? '',
        defaultCurrency: Currency.fromCode(json?['defaultCurrency'] as String?),
        defaultLanguage: Language.fromName(json?['defaultLanguage'] as String?),
        defaultTemplate: TemplateId.fromName(json?['defaultTemplate'] as String?),
        invoiceDueDays: json?['invoiceDueDays'] as int? ?? 14,
        defaultTaxPercent: (json?['defaultTaxPercent'] as num?)?.toDouble() ?? 0,
      );
}

class Client {
  const Client({
    required this.id,
    required this.name,
    this.phone = '',
    this.email = '',
    this.address = '',
    this.notes = '',
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String phone;
  final String email;
  final String address;
  final String notes;
  final int createdAt;
  final int updatedAt;

  Party get asParty => Party(name: name, phone: phone, address: address, email: email);

  Client copyWith({
    String? name,
    String? phone,
    String? email,
    String? address,
    String? notes,
    int? updatedAt,
  }) =>
      Client(
        id: id,
        name: name ?? this.name,
        phone: phone ?? this.phone,
        email: email ?? this.email,
        address: address ?? this.address,
        notes: notes ?? this.notes,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'address': address,
        'notes': notes,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Client.fromJson(Map<String, dynamic> json) => Client(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        email: json['email'] as String? ?? '',
        address: json['address'] as String? ?? '',
        notes: json['notes'] as String? ?? '',
        createdAt: json['createdAt'] as int? ?? 0,
        updatedAt: json['updatedAt'] as int? ?? 0,
      );
}

class Invoice {
  const Invoice({
    required this.id,
    required this.number,
    this.clientId,
    required this.status,
    required this.data,
    this.amountPaid = 0,
    this.paidAt,
    this.category,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String number;
  final String? clientId;
  final InvoiceStatus status;
  final DocumentData data;
  final double amountPaid;
  final String? paidAt;
  final String? category;
  final int createdAt;
  final int updatedAt;

  double get total => data.totals.total;
  Currency get currency => data.currency;
  String get date => data.date;
  String get dueDate => data.dueDate;
  String get title => data.customer.name.isNotEmpty ? data.customer.name : number;
  double get balance => round2((total - amountPaid).clamp(0, double.infinity));

  InvoiceStatus get effectiveStatus {
    if (status == InvoiceStatus.sent &&
        dueDate.isNotEmpty &&
        dueDate.compareTo(todayIso()) < 0) {
      return InvoiceStatus.overdue;
    }
    return status;
  }

  Invoice copyWith({
    String? number,
    String? clientId,
    InvoiceStatus? status,
    DocumentData? data,
    double? amountPaid,
    String? paidAt,
    String? category,
    int? updatedAt,
    bool clearPaidAt = false,
  }) =>
      Invoice(
        id: id,
        number: number ?? this.number,
        clientId: clientId ?? this.clientId,
        status: status ?? this.status,
        data: data ?? this.data,
        amountPaid: amountPaid ?? this.amountPaid,
        paidAt: clearPaidAt ? null : (paidAt ?? this.paidAt),
        category: category ?? this.category,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'number': number,
        'clientId': clientId,
        'status': status.name,
        'data': data.toJson(),
        'amountPaid': amountPaid,
        'paidAt': paidAt,
        'category': category,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
        id: json['id'] as String,
        number: json['number'] as String? ?? '',
        clientId: json['clientId'] as String?,
        status: InvoiceStatus.fromName(json['status'] as String?),
        data: DocumentData.fromJson(json['data'] as Map<String, dynamic>?),
        amountPaid: (json['amountPaid'] as num?)?.toDouble() ?? 0,
        paidAt: json['paidAt'] as String?,
        category: json['category'] as String?,
        createdAt: json['createdAt'] as int? ?? 0,
        updatedAt: json['updatedAt'] as int? ?? 0,
      );
}

class Expense {
  const Expense({
    required this.id,
    required this.vendor,
    required this.date,
    required this.amount,
    required this.currency,
    this.category = '',
    this.paymentMethod = PaymentMethod.cash,
    this.notes = '',
    this.receiptId,
    this.fileName,
    this.fileMime,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String vendor;
  final String date;
  final double amount;
  final Currency currency;
  final String category;
  final PaymentMethod paymentMethod;
  final String notes;
  final String? receiptId;
  final String? fileName;
  final String? fileMime;
  final int createdAt;
  final int updatedAt;

  bool get hasFile => fileName != null && fileName!.isNotEmpty;

  Expense copyWith({
    String? vendor,
    String? date,
    double? amount,
    Currency? currency,
    String? category,
    PaymentMethod? paymentMethod,
    String? notes,
    String? receiptId,
    String? fileName,
    String? fileMime,
    int? updatedAt,
    bool clearFile = false,
  }) =>
      Expense(
        id: id,
        vendor: vendor ?? this.vendor,
        date: date ?? this.date,
        amount: amount ?? this.amount,
        currency: currency ?? this.currency,
        category: category ?? this.category,
        paymentMethod: paymentMethod ?? this.paymentMethod,
        notes: notes ?? this.notes,
        receiptId: receiptId ?? this.receiptId,
        fileName: clearFile ? null : (fileName ?? this.fileName),
        fileMime: clearFile ? null : (fileMime ?? this.fileMime),
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'vendor': vendor,
        'date': date,
        'amount': amount,
        'currency': currency.code,
        'category': category,
        'paymentMethod': paymentMethod.key,
        'notes': notes,
        'receiptId': receiptId,
        'fileName': fileName,
        'fileMime': fileMime,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
        id: json['id'] as String,
        vendor: json['vendor'] as String? ?? '',
        date: json['date'] as String? ?? todayIso(),
        amount: (json['amount'] as num?)?.toDouble() ?? 0,
        currency: Currency.fromCode(json['currency'] as String?),
        category: json['category'] as String? ?? '',
        paymentMethod: PaymentMethod.fromKey(json['paymentMethod'] as String?),
        notes: json['notes'] as String? ?? '',
        receiptId: json['receiptId'] as String?,
        fileName: json['fileName'] as String?,
        fileMime: json['fileMime'] as String?,
        createdAt: json['createdAt'] as int? ?? 0,
        updatedAt: json['updatedAt'] as int? ?? 0,
      );
}

class Receipt {
  const Receipt({
    required this.id,
    required this.kind,
    required this.title,
    required this.date,
    required this.total,
    required this.currency,
    this.category,
    this.data,
    this.fileName,
    this.fileMime,
    this.notes,
    this.invoiceId,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final ReceiptKind kind;
  final String title;
  final String date;
  final double total;
  final Currency currency;
  final String? category;
  final DocumentData? data;
  final String? fileName;
  final String? fileMime;
  final String? notes;
  final String? invoiceId;
  final int createdAt;
  final int updatedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'kind': kind.name,
        'title': title,
        'date': date,
        'total': total,
        'currency': currency.code,
        'category': category,
        'data': data?.toJson(),
        'fileName': fileName,
        'fileMime': fileMime,
        'notes': notes,
        'invoiceId': invoiceId,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  factory Receipt.fromJson(Map<String, dynamic> json) => Receipt(
        id: json['id'] as String,
        kind: ReceiptKind.fromName(json['kind'] as String?),
        title: json['title'] as String? ?? '',
        date: json['date'] as String? ?? todayIso(),
        total: (json['total'] as num?)?.toDouble() ?? 0,
        currency: Currency.fromCode(json['currency'] as String?),
        category: json['category'] as String?,
        data: json['data'] == null ? null : DocumentData.fromJson(json['data'] as Map<String, dynamic>),
        fileName: json['fileName'] as String? ?? (json['file'] is Map ? (json['file'] as Map)['name'] as String? : null),
        fileMime: json['fileMime'] as String? ?? (json['file'] is Map ? (json['file'] as Map)['type'] as String? : null),
        notes: json['notes'] as String?,
        invoiceId: json['invoiceId'] as String?,
        createdAt: json['createdAt'] as int? ?? 0,
        updatedAt: json['updatedAt'] as int? ?? 0,
      );
}

class StoredFile {
  const StoredFile({required this.bytes, required this.name, required this.mime});

  final List<int> bytes;
  final String name;
  final String mime;
}

class MoneyBag {
  const MoneyBag(this.values);
  final Map<Currency, double> values;

  bool get isEmpty => values.values.every((v) => v == 0);

  String format([Language lang = Language.en]) {
    if (isEmpty) return '—';
    return values.entries
        .where((e) => e.value != 0)
        .map((e) => formatMoney(e.value, e.key, lang))
        .join(' · ');
  }

  static MoneyBag sum(Iterable<(Currency, double)> items) {
    final map = <Currency, double>{};
    for (final (c, v) in items) {
      map[c] = round2((map[c] ?? 0) + v);
    }
    return MoneyBag(map);
  }
}
