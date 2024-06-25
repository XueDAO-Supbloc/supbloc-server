import { config } from 'dotenv'

// Load config from .env
config()

export const API_PREFIX = process.env.API_PREFIX || '/api'
export const APP_PORT = process.env.APP_PORT || 3000
export const JWT_SECRET = process.env.JWT_SECRET || 'a secret key'
export const SALT_ROUNDS = process.env.SALT_ROUNDS || 10
export const NEO4J_URI = process.env.NEO4J_URI
export const NEO4J_USERNAME = process.env.NEO4J_USERNAME
export const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD
export const MAX_PATH_LENGTH = 100000
export const SNAPSHOT_DIR = './snapshots'
export const IPFS_SET = false

export const SUPPLIER_IDS = {
    SecondWood: "JE3Lv5iUir7F4xhr",
    Questin: "mN2UUTbzhQxnnPOW",
    DinoMinion: "QpZE0wtLK18vvPL3",
    UniPopcorn: "8QyYzsTjEM9z29MR",
    ButterCup: "HwkczC9SYE3nPogo",
    LavaCream: "YOu8sjqS2-9TzUfG",
    SunXiang: "tUtUZ2SmiTQQpE0g",
    HellDuck: "--dqhnfntudGJ_Ea",
    WormLaser: "v3H7CBO9zVFQ7jI6",
    MeguFire: "kKdes2yZ6ZOLzuLz",
    UIParrot: "YKtNBONuHrb1Eg3i"
}

export const PROCUCT_NAMES = {
    "iz6KFvHvA9Aym2uqu12U": {
        "name": "cake",
        "productID": "iz6KFvHvA9Aym2uqu12U",
        "supplierID": "JE3Lv5iUir7F4xhr",
    },
    "5RUhYOHAaR3TGEY0Fi7w": {
        "name": "chocolate",
        "productID": "5RUhYOHAaR3TGEY0Fi7w",
        "supplierID": "mN2UUTbzhQxnnPOW",
    },
    "kJjavJWZ7MnccWqfSVZB": {
        "name": "milk",
        "productID": "kJjavJWZ7MnccWqfSVZB",
        "supplierID": "QpZE0wtLK18vvPL3",
    },
    "2v0Ypayg82FM5kaUy4PG": {
        "name": "butter",
        "productID": "2v0Ypayg82FM5kaUy4PG",
        "supplierID": "8QyYzsTjEM9z29MR",
    },
    "oIwo33Rc0U_VoejUlmut": {
        "name": "flour",
        "productID": "oIwo33Rc0U_VoejUlmut",
        "supplierID": "YOu8sjqS2-9TzUfG",
    },
    "7ec0BAlqbvL2-vwZtKSI": {
        "name": "sugar",
        "productID": "7ec0BAlqbvL2-vwZtKSI",
        "supplierID": "YOu8sjqS2-9TzUfG",
    },
    "ysE9ZuJxqn7ixtl7srjh": {
        "name": "egg",
        "productID": "ysE9ZuJxqn7ixtl7srjh",
        "supplierID": "--dqhnfntudGJ_Ea",
    },
    "afkQgFCms7u6dZUIqR1P": {
        "name": "vanilla",
        "productID": "afkQgFCms7u6dZUIqR1P",
        "supplierID": "kKdes2yZ6ZOLzuLz",
    },
    "GUqR8HgqXp4fQ2cr5tkG": {
        "name": "baking soda",
        "productID": "GUqR8HgqXp4fQ2cr5tkG",
        "supplierID": "v3H7CBO9zVFQ7jI6",
    },
    "1Hi4LcCXjjWLd3m6oWOa": {
        "name": "baking powder",
        "productID": "1Hi4LcCXjjWLd3m6oWOa",
        "supplierID": "v3H7CBO9zVFQ7jI6",
    },
    "zDRIbbAIAYSCLH76mj3u": {
        "name": "salt",
        "productID": "zDRIbbAIAYSCLH76mj3u",
        "supplierID": "YOu8sjqS2-9TzUfG",
    }
}