import 'package:intl/intl.dart';

import '../data/models.dart';

double round2(double n) => (n * 100).round() / 100;

Totals computeTotals({
  required List<LineItem> items,
  required DiscountType discountType,
  required double discountValue,
  required double taxPercent,
}) {
  final subtotal = round2(
    items.fold<double>(
      0,
      (sum, i) => sum + (i.quantity) * (i.unitPrice),
    ),
  );
  final rawDiscount = discountType == DiscountType.percent
      ? (subtotal * discountValue) / 100
      : discountValue;
  final discount = round2(rawDiscount.clamp(0, subtotal));
  final taxable = subtotal - discount;
  final tax = round2((taxable * taxPercent) / 100);
  final total = round2(taxable + tax);
  return Totals(subtotal: subtotal, discount: discount, tax: tax, total: total);
}

String formatMoney(double amount, Currency currency, [Language lang = Language.en]) {
  final locale = lang == Language.ur
      ? 'en_PK'
      : switch (currency) {
          Currency.gbp => 'en_GB',
          Currency.usd => 'en_US',
          Currency.pkr => 'en_PK',
        };
  final digits = currency == Currency.pkr ? 0 : 2;
  return NumberFormat.currency(
    locale: locale,
    name: currency.code,
    decimalDigits: digits,
  ).format(amount);
}

String formatDate(String iso, [Language lang = Language.en]) {
  if (iso.isEmpty) return '';
  final d = DateTime.tryParse(iso);
  if (d == null) return iso;
  return DateFormat('d MMMM y', lang == Language.ur ? 'en' : 'en_GB').format(d);
}

String formatShortDate(String iso) {
  if (iso.isEmpty) return '';
  final d = DateTime.tryParse(iso);
  if (d == null) return iso;
  return DateFormat('d MMM y').format(d);
}

const _ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const _tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

String _below1000(int n) {
  final h = n ~/ 100;
  final r = n % 100;
  final rest = r < 20 ? _ones[r] : '${_tens[r ~/ 10]}${r % 10 != 0 ? ' ${_ones[r % 10]}' : ''}';
  return [if (h > 0) '${_ones[h]} Hundred', if (rest.isNotEmpty) rest].join(' ');
}

String _integerInWords(int n, bool southAsian) {
  if (n == 0) return 'Zero';
  final scales = southAsian
      ? <(int, String)>[(10000000, 'Crore'), (100000, 'Lakh'), (1000, 'Thousand')]
      : <(int, String)>[(1000000000, 'Billion'), (1000000, 'Million'), (1000, 'Thousand')];
  final parts = <String>[];
  var remaining = n;
  for (final (size, name) in scales) {
    if (remaining >= size) {
      parts.add('${_integerInWords(remaining ~/ size, southAsian)} $name');
      remaining %= size;
    }
  }
  if (remaining > 0) parts.add(_below1000(remaining));
  return parts.join(' ');
}

const _units = {
  Currency.pkr: ('Rupees', 'Paisa'),
  Currency.usd: ('Dollars', 'Cents'),
  Currency.gbp: ('Pounds', 'Pence'),
};

/// English amount in words, e.g. "Rupees One Lakh Twenty Thousand Only".
String amountInWords(double amount, Currency currency) {
  final value = (amount.clamp(0, double.infinity) * 100).round();
  final whole = value ~/ 100;
  final fraction = value % 100;
  final (major, minor) = _units[currency]!;
  final words = _integerInWords(whole, currency == Currency.pkr);
  final tail = fraction > 0 ? ' and ${_below1000(fraction)} $minor' : '';
  return currency == Currency.pkr
      ? '$major $words$tail Only'
      : '$words $major$tail Only';
}

String discountLabel(DocumentData data, String Function(String) tr) {
  final base = tr('discount');
  return data.discountType == DiscountType.percent
      ? '$base (${data.discountValue}%)'
      : base;
}

String initials(String name) {
  final words = name.trim().split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
  if (words.isEmpty) return '—';
  return words.take(2).map((w) => String.fromCharCodes(w.runes.take(1))).join().toUpperCase();
}
