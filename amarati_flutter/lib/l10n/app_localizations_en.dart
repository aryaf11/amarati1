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
  String get conversationsTitle => 'Conversations';

  @override
  String get assistantTitle => 'Smart assistant';

  @override
  String chatWelcomeUser(String name) {
    return 'Welcome, $name';
  }

  @override
  String get chatRoleOwner => 'Unit owner';

  @override
  String get chatTypeMessage => 'Type your message...';

  @override
  String get chatTabResidents => 'Residents';

  @override
  String get chatTabAnnouncements => 'Announcements';

  @override
  String get chatTabGroup => 'Group chats';

  @override
  String get chatGroupPinnedHint =>
      'To suggest a topic for the agenda, message us here';

  @override
  String get chatSendDemoOnly => 'Preview only — server sync coming soon';

  @override
  String get assistantWelcomeMessage =>
      'Welcome to Amarati! 👋 I\'m your smart assistant, here to make managing your unit and building simple and clear.\n\nFrom maintenance and reports to housing organization, payments, and alerts — everything in one place 👇\n\nAsk me anytime — I\'m always here to help ✨\n\nLet\'s start an easier, faster, smarter building experience with Amarati 🏢💙';

  @override
  String get assistantQuickStatus => 'What is my unit status?';

  @override
  String get assistantQuickMaintenance => 'View maintenance requests';

  @override
  String get assistantQuickNextVisit => 'When is the next maintenance visit?';

  @override
  String get assistantDemoReply =>
      'I\'ll guide you through the app step by step. Use the bottom bar: Home, Maintenance, Votes, and Account. Ask about joining with a building code or filing maintenance.';

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
