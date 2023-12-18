import 'package:famit_chat/src/functions/controller/scoket-controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class ChatController extends GetxController {
  static ChatController get instance => Get.find();

  /// Socket instance from SocketService
  final io.Socket socket = Get.find<SocketService>().socket;

  /// TextField Controllers to get data from TextFields
  final chat = TextEditingController();

  /// TextField Validation
  void sendMessage(String sender, String message, String receiver) {
    // Emit the 'sendMessage' event with the message data
    socket.emit('privateMessage', {
      'sender': sender,
      'message': message,
      'receiver': receiver,
    });
  }
}
