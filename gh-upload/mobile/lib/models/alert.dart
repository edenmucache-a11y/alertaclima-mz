/// Modelos de domínio do app AlertaClima · Moçambique

enum Severity { green, yellow, red }

extension SeverityX on Severity {
  String get label => switch (this) {
        Severity.green => 'Seguro',
        Severity.yellow => 'Atenção',
        Severity.red => 'Perigo Imediato',
      };

  /// Cor universal para mostrar na UI
  int get colorHex => switch (this) {
        Severity.green => 0xFF16A34A,
        Severity.yellow => 0xFFEAB308,
        Severity.red => 0xFFDC2626,
      };

  /// Prioridade de notificação
  String get priority => switch (this) {
        Severity.green => 'low',
        Severity.yellow => 'normal',
        Severity.red => 'high',
      };

  static Severity fromString(String s) => switch (s.toLowerCase()) {
        'red' => Severity.red,
        'yellow' => Severity.yellow,
        _ => Severity.green,
      };
}

class GeoPoint {
  final double lat;
  final double lon;
  const GeoPoint({required this.lat, required this.lon});

  factory GeoPoint.fromJson(Map<String, dynamic> j) =>
      GeoPoint(lat: (j['lat'] as num).toDouble(), lon: (j['lon'] as num).toDouble());

  Map<String, dynamic> toJson() => {'lat': lat, 'lon': lon};
}

class Alert {
  final String id;
  final String location;
  final GeoPoint coordinates;
  final Severity severity;
  final double rainfallMm;
  final int windKmh;
  final double temperatureC;
  final String description;
  final String advice;
  final String source;     // 'openweathermap' | 'cap-inam' | 'manual'
  final DateTime issuedAt;
  final DateTime expiresAt;

  Alert({
    required this.id,
    required this.location,
    required this.coordinates,
    required this.severity,
    required this.rainfallMm,
    required this.windKmh,
    required this.temperatureC,
    required this.description,
    required this.advice,
    required this.source,
    required this.issuedAt,
    required this.expiresAt,
  });

  factory Alert.fromJson(Map<String, dynamic> j) => Alert(
        id: j['id'] as String,
        location: j['location'] as String,
        coordinates: GeoPoint.fromJson(j['coordinates'] as Map<String, dynamic>),
        severity: SeverityX.fromString(j['severity'] as String),
        rainfallMm: (j['rainfallMm'] as num).toDouble(),
        windKmh: (j['windKmh'] as num).toInt(),
        temperatureC: (j['temperatureC'] as num).toDouble(),
        description: j['description'] as String,
        advice: j['advice'] as String,
        source: j['source'] as String,
        issuedAt: DateTime.parse(j['issuedAt'] as String),
        expiresAt: DateTime.parse(j['expiresAt'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'location': location,
        'coordinates': coordinates.toJson(),
        'severity': severity.name,
        'rainfallMm': rainfallMm,
        'windKmh': windKmh,
        'temperatureC': temperatureC,
        'description': description,
        'advice': advice,
        'source': source,
        'issuedAt': issuedAt.toIso8601String(),
        'expiresAt': expiresAt.toIso8601String(),
      };

  bool get isExpired => DateTime.now().isAfter(expiresAt);
  bool get isCritical => severity == Severity.red;
}
