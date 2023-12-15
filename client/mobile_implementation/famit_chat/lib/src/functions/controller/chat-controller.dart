import 'package:flutter/material.dart';
import 'package:get/get.dart';

class ChatController extends GetxController {
  static ChatController get instance => Get.find();

  /// TextField Controllers to get data from TextFields
  final chat = TextEditingController();

  /// TextField Validation

//Call this Function from Design & it will do the rest
// Future<void> loginUser(String email, String password) async {
//   await AuthenticationRepository.instance
//       .loginWithEmailAndPassword(email, password);
// }
}
