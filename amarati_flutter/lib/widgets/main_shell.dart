import 'package:flutter/material.dart';
import 'package:amarati_flutter/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

/// Bottom navigation mirroring `src/components/BottomNav.tsx`.
class MainShell extends StatelessWidget {
  const MainShell({required this.child, super.key});

  final Widget child;

  static final _homePattern = RegExp(r'^/building/[^/]+/?$');

  int _indexForPath(String path) {
    if (path.startsWith('/profile')) return 4;
    if (path == '/dashboard' || _homePattern.hasMatch(path)) return 0;
    if (path.contains('/maintenance')) return 1;
    if (path.contains('/payments')) return 2;
    if (path.contains('/votes')) return 3;
    return 0;
  }

  String? _buildingId(String path) {
    final m = RegExp(r'^/building/([^/]+)').firstMatch(path);
    return m?.group(1);
  }

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    final bid = _buildingId(path);
    final l10n = AppLocalizations.of(context)!;
    final hasBuilding = bid != null && bid.isNotEmpty;
    final idx = _indexForPath(path);

    void goHome() {
      if (hasBuilding) {
        context.go('/building/$bid');
      } else {
        context.go('/dashboard');
      }
    }

    void goMaintenance() {
      if (hasBuilding) {
        context.go('/building/$bid/maintenance');
      } else {
        context.go('/dashboard');
      }
    }

    void goPayments() {
      if (hasBuilding) {
        context.go('/building/$bid/payments');
      } else {
        context.go('/dashboard');
      }
    }

    void goVotes() {
      if (hasBuilding) {
        context.go('/building/$bid/votes');
      } else {
        context.go('/dashboard');
      }
    }

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx.clamp(0, 4),
        onDestinationSelected: (i) {
          switch (i) {
            case 0:
              goHome();
            case 1:
              goMaintenance();
            case 2:
              goPayments();
            case 3:
              goVotes();
            case 4:
              context.go('/profile');
          }
        },
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: l10n.home),
          NavigationDestination(
            icon: Icon(Icons.build_outlined, color: hasBuilding ? null : Theme.of(context).disabledColor),
            selectedIcon: const Icon(Icons.build),
            label: l10n.maintenance,
          ),
          NavigationDestination(
            icon: Icon(Icons.payment_outlined, color: hasBuilding ? null : Theme.of(context).disabledColor),
            selectedIcon: const Icon(Icons.payment),
            label: l10n.payments,
          ),
          NavigationDestination(
            icon: Icon(Icons.how_to_vote_outlined, color: hasBuilding ? null : Theme.of(context).disabledColor),
            selectedIcon: const Icon(Icons.how_to_vote),
            label: l10n.votes,
          ),
          NavigationDestination(icon: const Icon(Icons.person_outline), selectedIcon: const Icon(Icons.person), label: l10n.profile),
        ],
      ),
    );
  }
}
