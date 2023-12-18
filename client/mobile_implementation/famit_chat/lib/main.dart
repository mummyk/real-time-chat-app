import 'package:famit_chat/src/functions/controller/getAllUsers.dart';
import 'package:famit_chat/src/functions/controller/scoket-controller.dart';
import 'package:famit_chat/src/functions/controller/splash-controller.dart';
import 'package:famit_chat/src/screens/splash-screen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  final userController = Get.put(UserController());

  MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Famit Chat',
      home: const SplashScreen(),
      initialBinding: BindingsBuilder(() {
        // Initialize the socket service when the app starts
        Get.put(SocketService()).initializeSocket();
        Get.put(SplashController()); // Initialize SplashController
      }),
    );
  }
}
