import socket
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()


def start_tcp_server(host="127.0.0.1", port=65432):
    # AF_INET specifies IPv4 addresses
    # SOCK_STREAM specifies TCP, in-order, reliable, two-way connection-based byte streams
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((host, port))
    server.listen(5)
    print(f"Server listening on {host}:{port}")

    while True:
        client, addr = server.accept()
        print(f"Connected to {addr}")

        try:
            message = client.recv(1024).decode("utf-8")

            if message:
                print(f"Received message: {message}")

                # sentiment analysis
                valence = analyze_sentiment(message)
                print(f"Sentiment: {valence}")

                client.send(str(valence).encode("utf-8"))
            else:
                print("No message received")
                client.sendall("No message received".encode("utf-8"))

        except Exception as e:
            print(f"Error: {e}")

        finally:
            client.close()


def analyze_sentiment(message):
    scores = analyzer.polarity_scores(message)
    print("scores", scores)
    compound_score = scores["compound"]

    if compound_score >= 0.05:
        return "Positive"
    elif compound_score <= -0.05:
        return "Negative"
    else:
        return "Neutral"


if __name__ == "__main__":
    start_tcp_server()
