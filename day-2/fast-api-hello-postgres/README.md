```
docker-compose up --build

curl http://127.0.0.1:8000/hello/yourname
curl http://127.0.0.1:8000/messages
```

```
docker-compose exec db psql -U postgres -d fast_api_hello_db
select * from messages;
```

```
docker-compose down
```
