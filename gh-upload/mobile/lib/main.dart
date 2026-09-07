/// AlertaClima · Moçambique
///
/// App inicializa:
///  1. Firebase (FCM push)
///  2. Geolocalização
///  3. Mostra o Dashboard
library;

import 'package:flutter/material.dart';
import 'services/api_client.dart';
import 'services/fcm_service.dart';
import 'screens/dashboard_screen.dart';
import 'models/alert.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AlertaClimaApp());
}

class AlertaClimaApp extends StatefulWidget {
  const AlertaClimaApp({super.key});

  @override
  State<AlertaClimaApp> createState() => _AlertaClimaAppState();
}

class _AlertaClimaAppState extends State<AlertaClimaApp> {
  final ApiClient _api = ApiClient();
  late final FcmService _fcm = FcmService(_api);

  @override
  void initState() {
    super.initState();
    _bootstrapPush();
  }

  Future<void> _bootstrapPush() async {
    await _fcm.init();
    final token = await _fcm.getToken();
    if (token != null && mounted) {
      // Em produção: pedir permissão de geolocalização e enviar a cidade
      // mais próxima do utilizador
      await _fcm.subscribeToLocation(
        fcmToken: token,
        location: 'Maputo',
        coords: const GeoPoint(lat: -25.97, lon: 32.57),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AlertaClima · MZ',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        primaryColor: const Color(0xFF0F172A),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A),
          foregroundColor: Colors.white,
        ),
        colorScheme: ColorScheme.fromSwatch().copyWith(
          secondary: const Color(0xFF38BDF8),
        ),
      ),
      home: const DashboardScreen(),
    );
  }
}
