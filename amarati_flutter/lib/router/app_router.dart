import 'package:go_router/go_router.dart';

import '../app_state.dart';
import '../features/auth/check_email_page.dart';
import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import '../features/auth/signup_create_page.dart';
import '../features/auth/signup_join_page.dart';
import '../features/auth/signup_page.dart';
import '../features/auth/verify_email_page.dart';
import '../features/building/announcements_page.dart';
import '../features/building/building_home_page.dart';
import '../features/building/chat_page.dart';
import '../features/building/invite_page.dart';
import '../features/building/maintenance_page.dart';
import '../features/building/passport_page.dart';
import '../features/building/payments_page.dart';
import '../features/building/supervisor_page.dart';
import '../features/building/votes_page.dart';
import '../features/chatbot_page.dart';
import '../features/dashboard_page.dart';
import '../features/home/landing_page.dart';
import '../features/join_token_page.dart';
import '../features/profile_page.dart';
import '../widgets/main_shell.dart';

GoRouter createRouter(AppSession session) {
  return GoRouter(
    refreshListenable: session,
    redirect: (context, state) {
      final p = state.uri.path;
      final isPublic = p == '/' ||
          p.startsWith('/login') ||
          p.startsWith('/register') ||
          p.startsWith('/verify-email') ||
          p.startsWith('/signup') ||
          p.startsWith('/join/');
      if (!session.signedIn && !isPublic) {
        return '/login';
      }
      if (session.signedIn && p == '/login') {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const LandingPage(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/register/check-email',
        builder: (context, state) => const CheckEmailPage(),
      ),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) => const VerifyEmailPage(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupPage(),
      ),
      GoRoute(
        path: '/signup/create',
        builder: (context, state) => const SignupCreatePage(),
      ),
      GoRoute(
        path: '/signup/join',
        builder: (context, state) => const SignupJoinPage(),
      ),
      GoRoute(
        path: '/join/:token',
        builder: (context, state) {
          final token = state.pathParameters['token']!;
          return JoinTokenPage(token: token);
        },
      ),
      ShellRoute(
        builder: (context, state, child) {
          return MainShell(child: child);
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardPage(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfilePage(),
          ),
          GoRoute(
            path: '/chatbot',
            builder: (context, state) => const ChatbotPage(),
          ),
          GoRoute(
            path: '/building/:buildingId',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return BuildingHomePage(buildingId: id);
            },
          ),
          GoRoute(
            path: '/building/:buildingId/maintenance',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return MaintenancePage(buildingId: id);
            },
          ),
          GoRoute(
            path: '/building/:buildingId/votes',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return VotesPage(buildingId: id);
            },
          ),
          GoRoute(
            path: '/building/:buildingId/payments',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return PaymentsPage(buildingId: id);
            },
          ),
          GoRoute(
            path: '/building/:buildingId/chat',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return BuildingChatPage(buildingId: id);
            },
          ),
          GoRoute(
            path: '/building/:buildingId/announcements',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return AnnouncementsPage(buildingId: id);
            },
          ),
          GoRoute(
            path: '/building/:buildingId/invite',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return InvitePage(buildingId: id);
            },
          ),
          GoRoute(
            path: '/building/:buildingId/supervisor',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return SupervisorPage(buildingId: id);
            },
          ),
          GoRoute(
            path: '/building/:buildingId/passport',
            builder: (context, state) {
              final id = state.pathParameters['buildingId']!;
              return PassportPage(buildingId: id);
            },
          ),
        ],
      ),
    ],
  );
}
