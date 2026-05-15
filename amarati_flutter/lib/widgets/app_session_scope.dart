import 'package:flutter/material.dart';

import '../../app_state.dart';

class AppSessionScope extends InheritedNotifier<AppSession> {
  const AppSessionScope({required super.notifier, required super.child, super.key});

  static AppSession of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppSessionScope>();
    assert(scope != null, 'AppSessionScope not found');
    return scope!.notifier!;
  }
}
