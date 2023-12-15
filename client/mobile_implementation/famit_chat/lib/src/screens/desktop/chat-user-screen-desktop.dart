import 'package:flutter/material.dart';

import '../../widgets/users-display.dart';

class ChatUserScreen extends StatelessWidget {
  const ChatUserScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Container(
      height: size.height,
      width: size.width / 3,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: UsersDisplay(),
      ),
    );
  }
}
