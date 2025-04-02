```
pip install -r requirements.txt
docker run -d -p 5433:5432 --name fast_api_hello_db -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=fast_api_hello_db postgres:latest
```

```
fastapi dev main.py

curl http://127.0.0.1:8000/hello/yourname
curl http://127.0.0.1:8000/messages
```

```
docker exec -it fast_api_hello_db psql -U postgres -d fast_api_hello_db
select * from messages;
```
