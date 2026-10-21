import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'app_router.dart';
import 'core/theme.dart';
import 'data/store.dart';

class RaseedApp extends StatefulWidget {
  const RaseedApp({super.key, this.store});

  final LedgerStore? store;

  @override
  State<RaseedApp> createState() => _RaseedAppState();
}

class _RaseedAppState extends State<RaseedApp> {
  late final LedgerStore store;
  late final router = createRouter();

  @override
  void initState() {
    super.initState();
    store = widget.store ?? LedgerStore();
    store.init();
  }

  @override
  void dispose() {
    if (widget.store == null) store.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: store,
      child: MaterialApp.router(
        title: 'Raseed',
        debugShowCheckedModeBanner: false,
        theme: buildRaseedTheme(),
        routerConfig: router,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: const [Locale('en'), Locale('ur')],
        builder: (context, child) {
          return Consumer<LedgerStore>(
            builder: (context, ledger, _) {
              if (!ledger.ready && ledger.error == null) {
                return const Scaffold(body: Center(child: CircularProgressIndicator()));
              }
              if (!ledger.ready && ledger.error != null) {
                return Scaffold(
                  body: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text('Could not open the local ledger.\n${ledger.error}'),
                    ),
                  ),
                );
              }
              return child ?? const SizedBox.shrink();
            },
          );
        },
      ),
    );
  }
}
