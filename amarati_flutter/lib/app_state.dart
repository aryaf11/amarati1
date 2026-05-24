import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kLocale = 'app_locale';
const _kSignedIn = 'app_signed_in';

/// Global session: locale, sign-in flag (stub until real auth), theme.
class AppSession extends ChangeNotifier {
  AppSession() {
    _load();
  }

  Locale _locale = const Locale('ar');
  Locale get locale => _locale;

  bool _signedIn = true;
  bool get signedIn => _signedIn;

  ThemeMode _themeMode = ThemeMode.system;
  ThemeMode get themeMode => _themeMode;

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_kLocale);
    if (code == 'en' || code == 'ar') {
      _locale = Locale(code!);
    }
    _signedIn = prefs.getBool(_kSignedIn) ?? true;
    notifyListeners();
  }

  Future<void> setLocale(Locale value) async {
    _locale = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLocale, value.languageCode);
    notifyListeners();
  }

  Future<void> setSignedIn(bool value) async {
    _signedIn = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kSignedIn, value);
    notifyListeners();
  }

  void setThemeMode(ThemeMode mode) {
    _themeMode = mode;
    notifyListeners();
  }
}
