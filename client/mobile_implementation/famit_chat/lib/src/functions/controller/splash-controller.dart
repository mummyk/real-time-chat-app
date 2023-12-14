import 'package:get/get.dart';

import '../../utils/responsiveness.dart';

class SplashController extends GetxController {
  // This method will be called when the controller is initialized
  @override
  void onInit() {
    super.onInit();

    // Delay navigation after 5 seconds
    Future.delayed(const Duration(seconds: 5), () {
      // Navigate to another screen using Get.to
      Get.to(() => ResponsiveView());
    });
  }
}
