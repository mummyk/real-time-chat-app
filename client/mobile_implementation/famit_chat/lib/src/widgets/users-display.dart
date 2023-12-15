import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

class UsersDisplay extends StatelessWidget {
  const UsersDisplay({super.key});

  @override
  Widget build(BuildContext context) {
    final List<String> items = [
      'Item 1',
      'Item 2',
      'Item 3',
      'Item 4',
      'Item 5'
    ];
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.all(8.0),
          child: ListTile(
            textColor: Colors.white,
            selectedColor: Colors.green,
            tileColor: Colors.lightGreen,
            leading: CachedNetworkImage(
              imageUrl: "http://via.placeholder.com/350x150",
              progressIndicatorBuilder: (context, url, downloadProgress) =>
                  CircularProgressIndicator(value: downloadProgress.progress),
              errorWidget: (context, url, error) => Icon(
                Icons.error,
                color: Colors.white,
              ),
            ),
            title: Text(items[index]),
            subtitle: Text('Subtitle ${index + 1}'),
            onTap: () {},
          ),
        );
      },
    );
  }
}
