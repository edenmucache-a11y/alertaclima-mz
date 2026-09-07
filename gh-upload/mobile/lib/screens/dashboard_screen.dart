/// Dashboard principal — mapa de Moçambique + lista de alertas.
library;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/alert.dart';
import '../services/api_client.dart';
import '../widgets/severity_badge.dart';
import 'alerts_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late final ApiClient _api = ApiClient();
  List<Alert> _alerts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _refresh();
    // auto-refresh 5 min
    Future.doWhile(() async {
      await Future.delayed(const Duration(minutes: 5));
      if (!mounted) return false;
      await _refresh();
      return true;
    });
  }

  Future<void> _refresh() async {
    try {
      final data = await _api.fetchAlerts();
      if (!mounted) return;
      setState(() { _alerts = data; _loading = false; _error = null; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final reds = _alerts.where((a) => a.severity == Severity.red).length;
    final yellows = _alerts.where((a) => a.severity == Severity.yellow).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AlertaClima · Moçambique'),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
          IconButton(
            icon: const Icon(Icons.list_alt),
            tooltip: 'Ver lista',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AlertsScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildHeader(reds, yellows),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? _buildError()
                    : _buildMap(),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(int reds, int yellows) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: const Color(0xFF1E293B),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _stat('Alertas', _alerts.length.toString(), Colors.white),
          _stat('Críticos 🔴', reds.toString(), const Color(0xFFDC2626)),
          _stat('Atenção 🟡', yellows.toString(), const Color(0xFFEAB308)),
        ],
      ),
    );
  }

  Widget _stat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.bold)),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
      ],
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 48),
            const SizedBox(height: 16),
            Text('Erro: $_error', textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _refresh, child: const Text('Tentar novamente')),
          ],
        ),
      ),
    );
  }

  Widget _buildMap() {
    // Centro de Moçambique
    const center = LatLng(-18.665, 35.529);
    return FlutterMap(
      options: const MapOptions(
        initialCenter: center,
        initialZoom: 6,
        minZoom: 4,
        maxZoom: 12,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'mz.websiteminimax',
        ),
        MarkerLayer(
          markers: _alerts.map((a) {
            final color = Color(a.severity.colorHex);
            return Marker(
              point: LatLng(a.coordinates.lat, a.coordinates.lon),
              width: 80,
              height: 80,
              child: GestureDetector(
                onTap: () => _showAlertDetails(a),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: color.withOpacity(0.6), blurRadius: 12)],
                      ),
                      child: const Icon(Icons.warning, color: Colors.white, size: 18),
                    ),
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        a.location,
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  void _showAlertDetails(Alert a) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(a.location, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold))),
                SeverityBadge(severity: a.severity),
              ],
            ),
            const SizedBox(height: 12),
            Text(a.description, style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 16),
            _row('🌧 Chuva', '${a.rainfallMm.toStringAsFixed(1)} mm/h'),
            _row('💨 Vento', '${a.windKmh} km/h'),
            _row('🌡 Temperatura', '${a.temperatureC.toStringAsFixed(1)}°C'),
            _row('🕐 Emissão', a.issuedAt.toLocal().toString()),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black26,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Color(a.severity.colorHex).withOpacity(0.5)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.amber),
                  const SizedBox(width: 8),
                  Expanded(child: Text(a.advice, style: const TextStyle(color: Colors.white))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white60)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
