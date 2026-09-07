/// Cliente HTTP para a API backend do AlertaClima
library;

import 'package:dio/dio.dart';
import '../models/alert.dart';

class ApiClient {
  final Dio _dio;

  /// Em emulador Android, 10.0.2.2 aponta para o localhost do host.
  /// Em iOS simulator ou device físico, usar o IP da máquina.
  ApiClient({String baseUrl = 'http://10.0.2.2:3001/api'}) : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'Accept': 'application/json'},
        ));

  Future<List<Alert>> fetchAlerts() async {
    final res = await _dio.get('/alerts');
    final data = res.data as Map<String, dynamic>;
    final list = (data['alerts'] as List<dynamic>);
    return list.map((e) => Alert.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Alert?> fetchAlertByLocation(String location) async {
    try {
      final res = await _dio.get('/alerts/$location');
      return Alert.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<bool> subscribe({
    required String fcmToken,
    required String location,
    required GeoPoint coordinates,
    int radiusKm = 50,
  }) async {
    final res = await _dio.post('/push/subscribe', data: {
      'fcmToken': fcmToken,
      'location': location,
      'coordinates': coordinates.toJson(),
      'radiusKm': radiusKm,
      'channels': ['push'],
    });
    return res.statusCode == 200;
  }
}
