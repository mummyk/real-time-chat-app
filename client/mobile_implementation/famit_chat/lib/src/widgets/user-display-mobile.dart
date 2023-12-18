import 'package:famit_chat/src/screens/mobile/chat-screen-mobile.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../functions/controller/getAllUsers.dart';

class UsersDisplayMobile extends StatefulWidget {
  const UsersDisplayMobile({Key? key});

  @override
  State<UsersDisplayMobile> createState() => _UsersDisplayMobileState();
}

class _UsersDisplayMobileState extends State<UsersDisplayMobile> {
  final UserController userController = Get.find<UserController>();

  @override
  void initState() {
    super.initState();
    userController.getAllUserIds(); // Fetch user IDs when the widget is created
  }

  @override
  Widget build(BuildContext context) {
    return Obx(() {
      if (userController.userIds.isEmpty) {
        // Loading state
        return const Center(child: CircularProgressIndicator());
      } else {
        // User data is available
        return ListView.builder(
          itemCount: userController.userIds.length,
          itemBuilder: (context, index) {
            final userId = userController.userIds[index];

            // Find the user details in the response
            final user = userController.userData.firstWhere(
              (user) => user['id'] == userId,
              orElse: () =>
                  {'id': userId, 'name': 'Unknown', 'profile_picture': null},
            );

            return Padding(
              padding: const EdgeInsets.all(8.0),
              child: ListTile(
                textColor: Colors.white,
                selectedColor: Colors.green,
                tileColor: Colors.lightGreen,
                leading: SizedBox(
                  width: 48,
                  child: user['profile_picture'] != null
                      ? Image.network(
                          user['profile_picture'],
                          loadingBuilder: (BuildContext context, Widget child,
                              ImageChunkEvent? loadingProgress) {
                            if (loadingProgress == null) {
                              return child;
                            } else {
                              return Center(
                                child: CircularProgressIndicator(
                                  value: loadingProgress.expectedTotalBytes !=
                                          null
                                      ? loadingProgress.cumulativeBytesLoaded /
                                          (loadingProgress.expectedTotalBytes ??
                                              1)
                                      : null,
                                ),
                              );
                            }
                          },
                          errorBuilder: (BuildContext context, Object error,
                              StackTrace? stackTrace) {
                            return const Icon(
                              Icons.error,
                              color: Colors.white,
                            );
                          },
                        )
                      : const Icon(
                          Icons.account_circle,
                          size: 48,
                          color: Colors.white,
                        ),
                ),
                title: Text(user['name']),
                subtitle: Text('ID: ${user['id']}'),
                onTap: () {
                  // Handle user tap
                  Get.to(() => ChatScreenMobile(userData: user));
                },
              ),
            );
          },
        );
      }
    });
  }
}
