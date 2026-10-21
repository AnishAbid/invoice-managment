import 'package:sembast/sembast_memory.dart';

Future<Database> openPlatformDatabase(String name) {
  return databaseFactoryMemory.openDatabase(name);
}
