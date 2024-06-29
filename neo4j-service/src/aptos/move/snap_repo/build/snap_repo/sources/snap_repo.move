module snap_repo_addr::snap_repo{
    // use table and string
    use aptos_framework::account;
    use std::signer;
    use std::string::{String};
    use aptos_std::table::{Self, Table};

    use std::debug;
    // use 

    // ERR
    const E_NOT_INITIALIZED: u64 = 1;
    const E_SNAP_NOT_EXIST: u64 = 2;

    struct SnapRepo has key{
        content: Table<u256, u256>,
        counter: u64,
    }
    
    public entry fun create_repo(account: &signer){
        let repo_holder = SnapRepo{
            content: table::new(),
            counter: 0,
        };
        move_to(account, repo_holder);
    }
    public entry fun add_data(account: &signer, snap_id: u256, hash_val: u256)acquires SnapRepo{
        let signer_address = signer::address_of(account);
        // check repo exist
        assert!(exists<SnapRepo>(signer_address), E_NOT_INITIALIZED);
        let repo = borrow_global_mut<SnapRepo>(signer_address);
        let counter = repo.counter + 1;

        // upsert
        table::upsert(&mut repo.content, snap_id, hash_val);
        repo.counter = counter;
    }

    #[test(admin=@0x123)]
    public entry fun test_basic(admin: signer)acquires SnapRepo{
        account::create_account_for_test(signer::address_of(&admin));
        create_repo(&admin);
        // add 10 data
        for(i in 0..10){
            add_data(&admin,(i as u256), (0x502fc34923b3b81a4c38076c38c3f07c808051d98fea7fac1b010a4ed26844e6u256));
        };
        // check data
        assert!(exists<SnapRepo>(signer::address_of(&admin)), E_NOT_INITIALIZED); // check repo exist
        let repo = borrow_global<SnapRepo>(signer::address_of(&admin));
        
        // debug::print(&repo.counter);
        for(i in 0..10){
            let hash_val = table::borrow(&repo.content, i);
            assert!(*hash_val == 0x502fc34923b3b81a4c38076c38c3f07c808051d98fea7fac1b010a4ed26844e6u256, 4)
        }
    }

}