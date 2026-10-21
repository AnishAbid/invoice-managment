import 'package:sembast_web/sembast_web.dart';

Future<Database> openPlatformDatabase(String name) {
  return databaseFactoryWeb.openDatabase(name);
}
