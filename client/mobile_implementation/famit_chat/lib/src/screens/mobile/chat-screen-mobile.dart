import 'package:famit_chat/src/functions/controller/chat-controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../widgets/chat-bubble-list.dart';

class ChatScreenMobile extends StatelessWidget {
  const ChatScreenMobile({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(ChatController());
    final size = MediaQuery.of(context).size;
    return Scaffold(
      appBar: AppBar(
        title: Text("Chat"),
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
