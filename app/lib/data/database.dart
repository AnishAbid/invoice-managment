import 'package:sembast/sembast.dart';

import 'db_factory.dart';

const ledgerDbName = 'raseed.db';

Future<Database> openLedgerDatabase({DatabaseFactory? factory, String? path}) async {
  if (factory != null) {
    return factory.openDatabase(path ?? 'memory');
  }
  return openPlatformDatabase(ledgerDbName);
}
