export const ABI = {
    "address": "0x7ac70a2790d130df3b95c7b98b051b0744fec0289c39e2fd9b3da32cc4fe8421",
    "name": "snap_repo",
    "friends": [],
    "exposed_functions": [
        {
            "name": "add_data",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": ["&signer", "u256", "u256"], "return": []
        },
        {
            "name": "create_repo",
            "visibility": "public",
            "is_entry": true,
            "is_view": false,
            "generic_type_params": [],
            "params": ["&signer"], "return": []
        }
    ],
    "structs": [
        {
            "name": "SnapRepo",
            "is_native": false,
            "abilities": ["key"],
            "generic_type_params": [],
            "fields": [
                { "name": "content", "type": "0x1::table::Table<u256, u256>" },
                { "name": "counter", "type": "u64" }
            ]
        }
    ]
};
