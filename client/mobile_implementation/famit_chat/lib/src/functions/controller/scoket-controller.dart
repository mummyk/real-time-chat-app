import 'package:flutter/foundation.dart' as Foundation;
import 'package:get/get.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService extends GetxService {
  late io.Socket _socket;
  final userid = '32';
  static const devLink = "http://10.0.2.2:3000";
  io.Socket get socket => _socket;

  initializeSocket() {
    // Initialize the Socket.IO connection
    _socket = io.io(
      'http://10.0.2.2:3000',
      io.OptionBuilder()
          .setTransports(Foundation.kIsWeb
              ? ['polling']
              : ['websocket']) // for Flutter or Dart VM
          .disableAutoConnect() // disable auto-connection
          .build(),
    );

    _socket.io.options?['extraHeaders'] = {
      'userid': userid,
      'authorization':
          'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNDg3YWQ3MjMwZWVkY2M0ZjMzOWY3ZTJhZGEwYTc0ZGIwMTFiMTk5NTI2OThkYWRmNGQ1OGNmODU4N2MyNmM4ODAxMjExMTBmMzA0YTEwMjciLCJpYXQiOjE3MDI2MzM3ODcuNzE3MjQ3LCJuYmYiOjE3MDI2MzM3ODcuNzE3MjQ5LCJleHAiOjE3MzQyNTYxODcuNzE2NDEyLCJzdWIiOiIzMiIsInNjb3BlcyI6W119.lrlgNLaK16LM4njKrvXQ-ARgG8n9MLX_3smPHjG6ZXiaacwVQQFRugsE15E1i4VWjGtLR7CoSAquGp8WoADBh3P5aSEMHXyCZcMOuD7L-q2iztDpJAr0-qj67lfl0d_MJBjGjrdFMphpGhulKHWth89AGSMznWDhtSHPLIxM7vbpskYf_PzlxQQ_nDoIECHQxEalpQbYqVJSyrP93DAcazUhnWCYBZ7YnREsrdYa5WiY0VuOLguYEk8K7Y6ETmRdMSEVZAr3VK3NJnrwPHP8SZONqKbo8FncT17loPEH8LN-jrguVgDCUe3genNI5wWVGJFqWVy8RUMf2Sg7C3_7CYcZjUrvz0DRrx4DuKcTndBpBob69xdAzjDFj9gQkX-voAEhoeiF6IbMzPWO-hs6ne9veqQr2lHIun8nvp4dTVc-sn4DmyelkyZL13RsdM-GKLnVgytrlvhauuLY8ZK0Mmwce6aPfzyp0yCa4e3JWvxNZq6hUvVD0X8BGL-Tht3h1KjWPpIOujPXMRoMux6F6TpGpl8-1TbBRdp6C7MGvN22c3Kgf8UrjaBpXAeieh1_Ni2dGsT_p6t0UV1PsmXokOQjzGCkDUFeURMTO0vn4QbAsjhliWixf6JE7atDMQpWvZpkQkciHvyRI9gbpORIh_qzsjsS-VPRgzwMznnM7nA'
    };

    // Connect to the server
    _socket.connect();

    // Add listeners for events
    _socket.onConnect((data) {
      print('Connecting');
    });
    socket.on('privateMessage', (data) => print(data));
    //_socket.on('connect', (_) => print('Connected'));
    _socket.on('disconnect', (_) {
      print('Disconnected');
      // You may want to handle reconnection here
      _socket.on('reconnect', (_) => print('Reconnecting'));
    });

    // Add other event listeners as needed

    // Update the state
  }

  @override
  void onClose() {
    // Disconnect the socket when the service is closed
    _socket.disconnect();
    super.onClose();
  }
}
