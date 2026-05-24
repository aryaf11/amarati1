import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Amarati'**
  String get appTitle;

  /// No description provided for @appSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Smart building community'**
  String get appSubtitle;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @maintenance.
  ///
  /// In en, this message translates to:
  /// **'Maintenance'**
  String get maintenance;

  /// No description provided for @payments.
  ///
  /// In en, this message translates to:
  /// **'Payments'**
  String get payments;

  /// No description provided for @votes.
  ///
  /// In en, this message translates to:
  /// **'Votes'**
  String get votes;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get profile;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Log in'**
  String get login;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Sign up'**
  String get register;

  /// No description provided for @dashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// No description provided for @chatbot.
  ///
  /// In en, this message translates to:
  /// **'Assistant'**
  String get chatbot;

  /// No description provided for @landingBody.
  ///
  /// In en, this message translates to:
  /// **'Owners and tenants: join with a building code, maintenance, voting, and announcements. Connect your backend API to enable data.'**
  String get landingBody;

  /// No description provided for @placeholderNeedsApi.
  ///
  /// In en, this message translates to:
  /// **'This screen maps from the Next.js app. Wire `ApiClient` to your server.'**
  String get placeholderNeedsApi;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @arabic.
  ///
  /// In en, this message translates to:
  /// **'Arabic'**
  String get arabic;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @verifyEmail.
  ///
  /// In en, this message translates to:
  /// **'Verify email'**
  String get verifyEmail;

  /// No description provided for @checkEmail.
  ///
  /// In en, this message translates to:
  /// **'Check your email'**
  String get checkEmail;

  /// No description provided for @joinWithToken.
  ///
  /// In en, this message translates to:
  /// **'Join with invite'**
  String get joinWithToken;

  /// No description provided for @buildingOverview.
  ///
  /// In en, this message translates to:
  /// **'Building'**
  String get buildingOverview;

  /// No description provided for @announcements.
  ///
  /// In en, this message translates to:
  /// **'Announcements'**
  String get announcements;

  /// No description provided for @chat.
  ///
  /// In en, this message translates to:
  /// **'Chat'**
  String get chat;

  /// No description provided for @conversationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Conversations'**
  String get conversationsTitle;

  /// No description provided for @assistantTitle.
  ///
  /// In en, this message translates to:
  /// **'Smart assistant'**
  String get assistantTitle;

  /// No description provided for @chatWelcomeUser.
  ///
  /// In en, this message translates to:
  /// **'Welcome, {name}'**
  String chatWelcomeUser(String name);

  /// No description provided for @chatRoleOwner.
  ///
  /// In en, this message translates to:
  /// **'Unit owner'**
  String get chatRoleOwner;

  /// No description provided for @chatTypeMessage.
  ///
  /// In en, this message translates to:
  /// **'Type your message...'**
  String get chatTypeMessage;

  /// No description provided for @chatTabResidents.
  ///
  /// In en, this message translates to:
  /// **'Residents'**
  String get chatTabResidents;

  /// No description provided for @chatTabAnnouncements.
  ///
  /// In en, this message translates to:
  /// **'Announcements'**
  String get chatTabAnnouncements;

  /// No description provided for @chatTabGroup.
  ///
  /// In en, this message translates to:
  /// **'Group chats'**
  String get chatTabGroup;

  /// No description provided for @chatGroupPinnedHint.
  ///
  /// In en, this message translates to:
  /// **'To suggest a topic for the agenda, message us here'**
  String get chatGroupPinnedHint;

  /// No description provided for @chatSendDemoOnly.
  ///
  /// In en, this message translates to:
  /// **'Preview only — server sync coming soon'**
  String get chatSendDemoOnly;

  /// No description provided for @assistantWelcomeMessage.
  ///
  /// In en, this message translates to:
  /// **'Welcome to Amarati! 👋 I\'m your smart assistant, here to make managing your unit and building simple and clear.\n\nFrom maintenance and reports to housing organization, payments, and alerts — everything in one place 👇\n\nAsk me anytime — I\'m always here to help ✨\n\nLet\'s start an easier, faster, smarter building experience with Amarati 🏢💙'**
  String get assistantWelcomeMessage;

  /// No description provided for @assistantQuickStatus.
  ///
  /// In en, this message translates to:
  /// **'What is my unit status?'**
  String get assistantQuickStatus;

  /// No description provided for @assistantQuickMaintenance.
  ///
  /// In en, this message translates to:
  /// **'View maintenance requests'**
  String get assistantQuickMaintenance;

  /// No description provided for @assistantQuickNextVisit.
  ///
  /// In en, this message translates to:
  /// **'When is the next maintenance visit?'**
  String get assistantQuickNextVisit;

  /// No description provided for @assistantDemoReply.
  ///
  /// In en, this message translates to:
  /// **'I\'ll guide you through the app step by step. Use the bottom bar: Home, Maintenance, Votes, and Account. Ask about joining with a building code or filing maintenance.'**
  String get assistantDemoReply;

  /// No description provided for @invite.
  ///
  /// In en, this message translates to:
  /// **'Invite'**
  String get invite;

  /// No description provided for @supervisor.
  ///
  /// In en, this message translates to:
  /// **'Supervisor vote'**
  String get supervisor;

  /// No description provided for @passport.
  ///
  /// In en, this message translates to:
  /// **'Building passport'**
  String get passport;

  /// No description provided for @signup.
  ///
  /// In en, this message translates to:
  /// **'Sign up flow'**
  String get signup;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccount;

  /// No description provided for @joinBuilding.
  ///
  /// In en, this message translates to:
  /// **'Join building'**
  String get joinBuilding;

  /// No description provided for @theme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get theme;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get themeSystem;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
