// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Amarati';

  @override
  String get appSubtitle => 'Smart building community';

  @override
  String get home => 'Home';

  @override
  String get maintenance => 'Maintenance';

  @override
  String get payments => 'Payments';

  @override
  String get votes => 'Votes';

  @override
  String get profile => 'Account';

  @override
  String get login => 'Log in';

  @override
  String get register => 'Sign up';

  @override
  String get dashboard => 'Dashboard';

  @override
  String get chatbot => 'Assistant';

  @override
  String get landingBody =>
      'Owners and tenants: join with a building code, maintenance, voting, and announcements. Connect your backend API to enable data.';

  @override
  String get placeholderNeedsApi =>
      'This screen maps from the Next.js app. Wire `ApiClient` to your server.';

  @override
  String get language => 'Language';

  @override
  String get arabic => 'Arabic';

  @override
  String get english => 'English';

  @override
  String get verifyEmail => 'Verify email';

  @override
  String get checkEmail => 'Check your email';

  @override
  String get joinWithToken => 'Join with invite';

  @override
  String get buildingOverview => 'Building';

  @override
  String get announcements => 'Announcements';

  @override
  String get chat => 'Chat';

  @override
  String get invite => 'Invite';

  @override
  String get supervisor => 'Supervisor vote';

  @override
  String get passport => 'Building passport';

  @override
  String get signup => 'Sign up flow';

  @override
  String get createAccount => 'Create account';

  @override
  String get joinBuilding => 'Join building';

  @override
  String get theme => 'Theme';

  @override
  String get themeSystem => 'System';

  @override
  String get themeLight => 'Light';

  @override
  String get themeDark => 'Dark';
}
