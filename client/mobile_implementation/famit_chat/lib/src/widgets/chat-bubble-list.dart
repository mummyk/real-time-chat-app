import 'package:flutter/material.dart';

import 'chat-bubble.dart';

class ChatBubbleList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      reverse: true, // Set reverse to true to start from the bottom
      itemCount: 10, // Replace this with the actual number of chat bubbles
      itemBuilder: (context, index) {
        // Replace this with your ChatBubble widget or custom chat item
        return ChatBubble(
          message: 'Chat message $index',
          contentFrom: 'outgoing',
        );
      },
    );
  }
}
