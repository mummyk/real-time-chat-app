import 'package:famit_chat/src/functions/controller/splash-controller.dart';
import 'package:famit_chat/src/screens/splash-screen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Famit Chat',
      home: const SplashScreen(),
      initialBinding: BindingsBuilder(() {
        Get.put(SplashController()); // Initialize SplashController
      }),
    );
  }
}
