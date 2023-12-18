import 'package:famit_chat/src/functions/controller/chat-controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../widgets/chat-bubble-list.dart';

class ChatScreenMobile extends StatelessWidget {
  final Map<String, dynamic> userData;
  ChatScreenMobile({super.key, required this.userData});
  final controller = Get.put(ChatController());

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ChatController());
    final size = MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        title: Text(userData['name']),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.grey,
            height: size.height * 7 / 8,
            width: size.width,
            child: Align(
              alignment: Alignment.bottomRight,
              child: ChatBubbleList(),
            ),
          ),
          Expanded(
            child: Row(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Container(
                    width: (size.width - 70),
                    child: TextFormField(
                      controller: controller.chat,
                      decoration: const InputDecoration(
                        hintText: "Type Message",
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: GestureDetector(
                    onTap: () {
                      // Handle button press
                      final receiver = userData['id'];
                      final message = controller.chat.text;
                      const sender = "32";
                      controller.sendMessage(sender, message, receiver);
                    },
                    child: const Icon(
                      Icons.send,
                      color: Colors.green, // Set the desired color
                    ),
                  ),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
