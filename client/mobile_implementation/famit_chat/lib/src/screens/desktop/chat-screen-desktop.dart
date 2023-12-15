import 'package:famit_chat/src/functions/controller/chat-controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../widgets/chat-bubble-list.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ChatController());
    final size = MediaQuery.of(context).size;
    return Column(
      children: [
        Container(
          color: Colors.grey,
          height: size.height * 7 / 8,
          width: size.width * 2 / 3,
          child: Align(
            alignment: Alignment.bottomRight,
            child: ChatBubbleList(),
          ),
        ),
        Expanded(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Container(
                width: (size.width * 2 / 3) - 70,
                child: TextFormField(
                  controller: controller.chat,
                  decoration: const InputDecoration(
                    hintText: "Type Message",
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: () {
                  // Handle button press
                },
                child: Container(
                  child: Icon(
                    Icons.send,
                    color: Colors.green, // Set the desired color
                  ),
                ),
              )
            ],
          ),
        )
      ],
    );
  }
}
