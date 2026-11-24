import 'package:uuid/uuid.dart';

const _uuid = Uuid();

String newId() => _uuid.v4();

String todayIso() {
  final d = DateTime.now();
  return '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';
}

String monthPeriod([DateTime? now]) {
  final d = now ?? DateTime.now();
  return '${d.year}${d.month.toString().padLeft(2, '0')}';
}

String dueInDays(int days) {
  final d = DateTime.now().add(Duration(days: days));
  return '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';
}
