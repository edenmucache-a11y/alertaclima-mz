/// Wrapper sobre Firebase Cloud Messaging.
///
///  - Inicializa o Firebase
///  - Pede permissão e obtém o FCM token
///  - Mostra notificação local quando chega push em foreground
///  - Faz subscribe no backend
library;

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_client.dart';
import '../models/alert.dart';

class FcmService {
  final ApiClient _api;
  final FlutterLocalNotificationsPlugin _local = FlutterLocalNotificationsPlugin();

  FcmService(this._api);

  Future<void> init() async {
    try {
      await Firebase.initializeApp();
    } catch (e) {
      debugPrint('⚠️  Firebase não inicializou: $e (continua sem push)');
      return;
    }

    // Pedir permissão (iOS + Android 13+)
    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('🔔 Permissão FCM: ${settings.authorizationStatus}');

    // Canal Android (severas)
    const channel = AndroidNotificationChannel(
      'severe_weather',
      'Alertas severos',
      description: 'Notificações de ciclones e chuvas intensas',
      importance: Importance.max,
    );
    await _local
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // Handler em foreground
    FirebaseMessaging.onMessage.listen(_onForegroundMessage);

    // Handler quando o utilizador toca na notificação
    FirebaseMessaging.onMessageOpenedApp.listen(_onMessageOpenedApp);
  }

  Future<String?> getToken() async {
    try {
      return await FirebaseMessaging.instance.getToken();
    } catch (e) {
      debugPrint('⚠️  Falha a obter FCM token: $e');
      return null;
    }
  }

  Future<void> subscribeToLocation({
    required String fcmToken,
    required String location,
    required GeoPoint coords,
  }) async {
    try {
      await _api.subscribe(fcmToken: fcmToken, location: location, coordinates: coords);
      debugPrint('✓ Subscrito em $location');
    } catch (e) {
      debugPrint('✗ Falha na subscrição: $e');
    }
  }

  void _onForegroundMessage(RemoteMessage message) {
    final data = message.data;
    final severity = data['severity'] as String? ?? 'green';
    final location = data['location'] as String? ?? '';

    _local.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      message.notification?.title ?? 'Alerta $severity · $location',
      message.notification?.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'severe_weather',
          'Alertas severos',
          channelDescription: 'Notificações de ciclones e chuvas intensas',
          importance: Importance.max,
          priority: Priority.high,
          color: Color(severity == 'red'
              ? 0xFFDC2626
              : severity == 'yellow'
                  ? 0xFFEAB308
                  : 0xFF16A34A),
        ),
      ),
      payload: data.toString(),
    );
  }

  void _onMessageOpenedApp(RemoteMessage message) {
    debugPrint('👆 Notificação tocada: ${message.data}');
  }
}
