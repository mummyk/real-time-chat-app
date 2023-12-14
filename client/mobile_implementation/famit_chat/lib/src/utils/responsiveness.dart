import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../screens/desktop/desktop.dart';
import '../screens/mobile/mobile.dart';

class ResponsiveController extends GetxController {}

class ResponsiveView extends GetResponsiveView<ResponsiveController> {
  ResponsiveView({super.key});

  @override
  Widget builder() {
    return Scaffold(
      body: ResponsiveViewCases1(),
    );
  }
}

class ResponsiveViewCases1 extends GetResponsiveView<ResponsiveController> {
  ResponsiveViewCases1({super.key})
      : super(
            settings: const ResponsiveScreenSettings(
          desktopChangePoint: 500,
        ));

  @override
  Widget builder() =>
      screen.isDesktop ? const DesktopScreen() : const MobileScreen();
}
