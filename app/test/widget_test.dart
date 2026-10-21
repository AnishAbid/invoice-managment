import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:raseed/core/ids.dart';
import 'package:raseed/data/store.dart';
import 'package:raseed/features/dashboard/dashboard_page.dart';
import 'package:sembast/sembast_memory.dart';

void main() {
  testWidgets('dashboard shows overview and empty-book actions', (tester) async {
    late LedgerStore store;
    await tester.runAsync(() async {
      final db = await databaseFactoryMemory.openDatabase(newId());
      store = LedgerStore(database: db);
      await store.init();
    });

    await tester.pumpWidget(
      ChangeNotifierProvider.value(
        value: store,
        child: const MaterialApp(home: DashboardPage()),
      ),
    );

    expect(find.text('Overview'), findsOneWidget);
    expect(find.text('Start your books'), findsOneWidget);
    expect(find.text('New invoice'), findsOneWidget);
  });
}
