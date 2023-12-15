import 'package:famit_chat/src/widgets/user-display-mobile.dart';
import 'package:flutter/material.dart';

class ChatUserScreenMobile extends StatelessWidget {
  const ChatUserScreenMobile({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Container(
      height: size.height,
      width: size.width,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: UsersDisplayMobile(),
      ),
    );
  }
}
