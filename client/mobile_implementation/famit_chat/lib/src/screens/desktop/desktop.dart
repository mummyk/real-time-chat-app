import 'package:flutter/material.dart';

import 'chat-screen-desktop.dart';
import 'chat-user-screen-desktop.dart';

class DesktopScreen extends StatelessWidget {
  const DesktopScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [ChatUserScreen(), ChatScreen()],
    );
  }
}
