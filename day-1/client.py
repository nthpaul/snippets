import socket

def tcp_client(message, host='127.0.0.1', port=65432):
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client.connect((host, port))

    client.send(message.encode('utf-8'))

    response = client.recv(1024).decode('utf-8')
    print(f"Server response: {response}")

    client.close()

if __name__ == "__main__":
    messages = [
        "wow that's crazy",
        "incredible!",
        "oh, really?",
        "that was a fascinating story",
        "can you repeat that?",
        "hah"
    ]

    for msg in messages:
        tcp_client(msg)