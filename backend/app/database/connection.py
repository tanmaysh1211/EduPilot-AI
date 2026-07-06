# from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
# import os
# print("A")

load_dotenv()
# print("B")

import os
# print("C")
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# print("DATABASE_URL =", DATABASE_URL)

from sqlalchemy import create_engine
# print("D")

# engine = create_engine(DATABASE_URL)

# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = declarative_base()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# engine = create_engine(
#     DATABASE_URL,
#     connect_args={"connect_timeout": 5},
# )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "connect_timeout": 5,
        "sslmode": "require",
    },
)

# print("E")

from sqlalchemy.orm import sessionmaker
# SessionLocal = sessionmaker(bind=engine)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
# print("F")

from sqlalchemy.orm import declarative_base
Base = declarative_base()
# print("G")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()