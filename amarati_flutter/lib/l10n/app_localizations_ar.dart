// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'عَمارتي';

  @override
  String get appSubtitle => 'تواصل سكان العمارة';

  @override
  String get home => 'الرئيسية';

  @override
  String get maintenance => 'الصيانة';

  @override
  String get payments => 'المدفوعات';

  @override
  String get votes => 'التصويتات';

  @override
  String get profile => 'الحساب';

  @override
  String get login => 'تسجيل الدخول';

  @override
  String get register => 'تسجيل';

  @override
  String get dashboard => 'لوحة التحكم';

  @override
  String get chatbot => 'المساعد';

  @override
  String get landingBody =>
      'للملاك والمستأجرين: انضمام برمز المبنى، الصيانة، التصويت، وإعلانات المبنى. اربط واجهة الخادم لتفعيل البيانات.';

  @override
  String get placeholderNeedsApi =>
      'هذه الشاشة مطابقة لتطبيق Next.js. اربط `ApiClient` بالخادم.';

  @override
  String get language => 'اللغة';

  @override
  String get arabic => 'العربية';

  @override
  String get english => 'English';

  @override
  String get verifyEmail => 'تأكيد البريد';

  @override
  String get checkEmail => 'تحقق من بريدك';

  @override
  String get joinWithToken => 'دعوة انضمام';

  @override
  String get buildingOverview => 'المبنى';

  @override
  String get announcements => 'الإعلانات';

  @override
  String get chat => 'المحادثة';

  @override
  String get conversationsTitle => 'المحادثات';

  @override
  String get assistantTitle => 'المساعد الذكي';

  @override
  String chatWelcomeUser(String name) {
    return 'مرحبًا $name';
  }

  @override
  String get chatRoleOwner => 'مالك شقة';

  @override
  String get chatTypeMessage => 'اكتب رسالتك...';

  @override
  String get chatTabResidents => 'السكان';

  @override
  String get chatTabAnnouncements => 'الإعلانات';

  @override
  String get chatTabGroup => 'محادثات جماعية';

  @override
  String get chatGroupPinnedHint => 'إذا أحد يحتاج إضافة موضوع يكتب لنا';

  @override
  String get chatSendDemoOnly => 'معاينة فقط — الربط بالخادم قريباً';

  @override
  String get assistantWelcomeMessage =>
      'أهلاً بك في عمارتي! 👋 أنا مساعدك الذكي، جاهز أسهّل عليك إدارة شقتك وعمارتك بخطوات بسيطة وواضحة.\n\nمن متابعة الصيانة، واستقبال البلاغات، وتنظيم السكن... إلى متابعة المدفوعات والتنبيهات — كل شيء عندك في مكان واحد 👇\n\nإذا احتجت أي مساعدة، اسألني مباشرة... وأنا هنا دائماً لخدمتك ✨\n\nخلينا نبدأ معاً بتجربة إدارة أسهل، أسرع، وأذكى مع عمارتي 🏢💙';

  @override
  String get assistantQuickStatus => 'معلومات شقتي';

  @override
  String get assistantQuickMaintenance => 'عرض طلبات الصيانة';

  @override
  String get assistantQuickNextVisit => 'متى موعد الصيانة القادمة؟';

  @override
  String get assistantDemoReply =>
      'سأساعدك في استخدام التطبيق خطوة بخطوة. جرّب من الشريط السفلي: الرئيسية، الصيانة، التصويت، والحساب. اسألني عن الانضمام برمز المبنى أو تقديم طلب صيانة.';

  @override
  String get invite => 'دعوة';

  @override
  String get supervisor => 'تصويت المشرف';

  @override
  String get passport => 'جواز المبنى';

  @override
  String get signup => 'إنشاء حساب';

  @override
  String get createAccount => 'إنشاء الحساب';

  @override
  String get joinBuilding => 'الانضمام للمبنى';

  @override
  String get theme => 'المظهر';

  @override
  String get themeSystem => 'النظام';

  @override
  String get themeLight => 'فاتح';

  @override
  String get themeDark => 'داكن';
}
