import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:amarati_flutter/l10n/app_localizations.dart';

import 'app_state.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';
import 'widgets/app_session_scope.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AmaratiApp());
}

class AmaratiApp extends StatefulWidget {
  const AmaratiApp({super.key});

  @override
  State<AmaratiApp> createState() => _AmaratiAppState();
}

class _AmaratiAppState extends State<AmaratiApp> {
  late final AppSession _session = AppSession();
  late final GoRouter _router = createRouter(_session);

  @override
  void dispose() {
    _session.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _session,
      builder: (context, _) {
        return AppSessionScope(
          notifier: _session,
          child: MaterialApp.router(
            debugShowCheckedModeBanner: false,
            locale: _session.locale,
            theme: AppTheme.light,
            darkTheme: AppTheme.dark,
            themeMode: _session.themeMode,
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            routerConfig: _router,
          ),
        );
      },
    );
  }
}
