/// Ecrã com lista de alertas activos — ordenada por severidade.
library;

import 'package:flutter/material.dart';
import '../models/alert.dart';
import '../services/api_client.dart';
import '../widgets/severity_badge.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  late final ApiClient _api = ApiClient();
  List<Alert> _alerts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _api.fetchAlerts();
      if (!mounted) return;
      setState(() { _alerts = data; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final sorted = [..._alerts]..sort((a, b) {
        const order = {Severity.red: 0, Severity.yellow: 1, Severity.green: 2};
        return order[a.severity]! - order[b.severity]!;
      });

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        title: const Text('Alertas activos'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.separated(
                padding: const EdgeInsets.all(12),
                itemCount: sorted.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) => _AlertCard(alert: sorted[i]),
              ),
            ),
    );
  }
}

class _AlertCard extends StatelessWidget {
  final Alert alert;
  const _AlertCard({required this.alert});

  @override
  Widget build(BuildContext context) {
    final color = Color(alert.severity.colorHex);
    return Card(
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withOpacity(0.4), width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    alert.location,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                ),
                SeverityBadge(severity: alert.severity),
              ],
            ),
            const SizedBox(height: 8),
            Text(alert.description, style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 8),
            Row(
              children: [
                _metric('🌧', '${alert.rainfallMm.toStringAsFixed(1)} mm'),
                const SizedBox(width: 16),
                _metric('💨', '${alert.windKmh} km/h'),
                const SizedBox(width: 16),
                _metric('🌡', '${alert.temperatureC.toStringAsFixed(1)}°C'),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(6)),
              child: Row(
                children: [
                  const Icon(Icons.shield, color: Colors.amber, size: 16),
                  const SizedBox(width: 6),
                  Expanded(child: Text(alert.advice, style: const TextStyle(color: Colors.white, fontSize: 12))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metric(String icon, String value) {
    return Text('$icon $value', style: const TextStyle(color: Colors.white60, fontSize: 13));
  }
}
