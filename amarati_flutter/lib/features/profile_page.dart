import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

import '../widgets/app_session_scope.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = AppSessionScope.of(context);
    final isAr = session.locale.languageCode == 'ar';
    return Scaffold(
      appBar: AppBar(title: Text(l10n.profile)),
      body: ListView(
        children: [
          ListTile(
            title: Text(l10n.language),
            subtitle: Text(isAr ? l10n.arabic : l10n.english),
            trailing: SegmentedButton<bool>(
              segments: [
                ButtonSegment(value: true, label: Text(l10n.arabic)),
                ButtonSegment(value: false, label: Text(l10n.english)),
              ],
              selected: {isAr},
              onSelectionChanged: (s) {
                final ar = s.first;
                session.setLocale(Locale(ar ? 'ar' : 'en'));
              },
            ),
          ),
          const Divider(),
          ListTile(
            title: Text(l10n.theme),
            trailing: DropdownButton<ThemeMode>(
              value: session.themeMode,
              onChanged: (m) {
                if (m != null) session.setThemeMode(m);
              },
              items: [
                DropdownMenuItem(value: ThemeMode.system, child: Text(l10n.themeSystem)),
                DropdownMenuItem(value: ThemeMode.light, child: Text(l10n.themeLight)),
                DropdownMenuItem(value: ThemeMode.dark, child: Text(l10n.themeDark)),
              ],
            ),
          ),
          const Divider(),
          ListTile(
            title: Text(l10n.login),
            subtitle: Text(l10n.placeholderNeedsApi),
            onTap: () async {
              await session.setSignedIn(false);
              if (context.mounted) context.go('/');
            },
          ),
        ],
      ),
    );
  }
}
