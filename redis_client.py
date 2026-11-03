
import os
import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.Redis.from_url(
    REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=3,
    socket_timeout=3
)


def test_redis_connection():
    try:
        if redis_client.ping():
            print("Redis connected successfully!")
    except redis.RedisError as e:
        print("Redis connection failed:", e)


def invalidate_dashboard_cache(user_id: int):
    cache_key = f"dashboard:stats:user:{user_id}"

    try:
        deleted = redis_client.delete(cache_key)

        if deleted:
            print(f"Dashboard cache invalidated for user {user_id}")
        else:
            print(f"No dashboard cache found for user {user_id}")

    except redis.RedisError as e:
        print("Redis invalidation error:", e)
