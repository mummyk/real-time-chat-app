import 'package:flutter/material.dart';

class ChatBubble extends StatelessWidget {
  final String message;
  final String contentFrom;

  const ChatBubble({Key? key, required this.message, required this.contentFrom})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Container(
      padding: EdgeInsets.all(8),
      margin: EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: contentFrom == 'incoming' ? Colors.white : Colors.green,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        message,
        style: TextStyle(
          color: contentFrom == 'incoming' ? Colors.black : Colors.white,
        ),
      ),
    );
  }
}
