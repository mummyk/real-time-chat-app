import 'dart:convert';

import 'package:get/get.dart'; // Import the Get package
import 'package:http/http.dart' as http;

class UserController extends GetxController {
  RxList<int> userIds = <int>[].obs;
  RxList<Map<String, dynamic>> userData = <Map<String, dynamic>>[].obs;

  Future<void> getAllUserIds() async {
    final apiUrl = "http://10.0.2.2:3000/api/all-users";
    final authToken =
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiN2IwYzE3ZmMzMTVjNjU2OTQxOWE4NGU3MjJjMzlkYzg0ODQwYTAxNzU2ZjE5ZTQ4YjcyN2E1MDViOGQ2ZjVkMTEwZjU4YzI2OWYyYjgwZjEiLCJpYXQiOjE3MDExODY4MjUuMDg4ODU4LCJuYmYiOjE3MDExODY4MjUuMDg4ODYsImV4cCI6MTczMjgwOTIyNS4wODc2MDEsInN1YiI6IjYzIiwic2NvcGVzIjpbXX0.EnAeauXopiE2BC0RRLMVFTBLzy-elpYbBJSYOr8A6H-QmSSaSSnURvvbxSo2ELnFkIf0g57nirfWa-b-n36fGV8K36Udq_9ZiKvRoeXEHgtAC2XCOBzDQiDXIuJtHRqLHW4yjwTzMu4y9nV1q2RRtUOWxyAM7w8b5d-LJAiZdBas_eitMkGE5BkYqmFn_nKTnIBM7SZ8E3UqWBCVYcLknLbKd1ePrA6LOd00IXAkK4PQriHgs7-zzmYDaS8nuT92Sv8v4T-yGD9Ixlxfz05Kkyj3w6wNsQVkiLcq57t2eJ48_-YV7IENyuOD2POUVFol58UICFuVZvio2eZBP0t7RVovERYFppMWi4whsOxH3y0KxQvH_CCpg6b1X5k7D1Lf2-_HgVAteJFEWNiyiyV5WVQJS54ihdIEhtfZXkYeK5PNx_XcH3pXlUHAWAtfaLraDkdbLz1zaLemmpwjYr3Tj0s1O7OAFwJDSQ7_bGa1JAn2zXUCsYsN_ElQk3PYoNxHjUwJyNVyhuK5e-hBYSH6QlT4vyBhHrqLWxqguzM67rwgTPYPivgEgYXjleL_i8tEmhSoJL2qy2MLBkdOSTUrHVp90G0CJHcqSBqPNziwx7V5Ko9c0XzOdWLIh4sXSix3dPTvYchpjgbmXin6gZW3JKsfgAsWMg8nER7PA6EQB5g";

    try {
      final response = await http.get(
        Uri.parse(apiUrl),
        headers: {
          'userId': '32',
          'recieverId': '1',
          'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        userIds.assignAll(List<int>.from(data.map((user) => user['id'])));
        userData.assignAll(List<Map<String, dynamic>>.from(data));
      } else {
        print("Error: ${response.statusCode}");
        print("Response body: ${response.body}");
        throw Exception("Failed to load user Data");
      }
    } catch (error) {
      print("Error: $error");
      throw Exception("Failed to load user IDs");
    }
  }
}
