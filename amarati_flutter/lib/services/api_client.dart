import 'dart:convert';

import 'package:http/http.dart' as http;

/// HTTP client for a future REST (or GraphQL) API that replaces Next.js server actions.
///
/// Point [baseUrl] at your backend when available (e.g. `https://api.example.com`).
class ApiClient {
  ApiClient({this.baseUrl = '', http.Client? httpClient})
      : _http = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _http;

  Uri _uri(String path, [Map<String, String>? query]) {
    final root = baseUrl.isEmpty ? Uri.parse('https://placeholder.invalid') : Uri.parse(baseUrl);
    return root.replace(path: '${root.path}$path', queryParameters: query);
  }

  Future<Map<String, dynamic>?> getJson(String path) async {
    if (baseUrl.isEmpty) return null;
    final res = await _http.get(_uri(path));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw ApiException(res.statusCode, res.body);
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  void close() => _http.close();
}

class ApiException implements Exception {
  ApiException(this.statusCode, this.body);
  final int statusCode;
  final String body;

  @override
  String toString() => 'ApiException($statusCode): $body';
}
