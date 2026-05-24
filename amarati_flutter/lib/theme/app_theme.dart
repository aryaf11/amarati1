import 'package:flutter/material.dart';

/// Brand color from Next.js `layout.tsx` themeColor.
const Color kBrandPrimary = Color(0xFF157083);

abstract final class AppTheme {
  static ThemeData get light {
    final base = ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: kBrandPrimary, brightness: Brightness.light),
      useMaterial3: true,
    );
    return base.copyWith(
      appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: kBrandPrimary.withValues(alpha: 0.18),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
    );
  }

  static ThemeData get dark {
    final base = ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: kBrandPrimary, brightness: Brightness.dark),
      useMaterial3: true,
    );
    return base.copyWith(
      appBarTheme: const AppBarTheme(centerTitle: true, elevation: 0),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: kBrandPrimary.withValues(alpha: 0.28),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
    );
  }
}
