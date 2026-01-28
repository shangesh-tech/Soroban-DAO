#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Env, String,
};

// ═══════════════════════════════════════════════════════════════════════════════
//                              INITIALIZATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_initialize() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    // Initialize the contract
    client.initialize(&admin);
    
    // Verify admin is set
    let stored_admin = client.get_admin();
    assert_eq!(stored_admin, Some(admin.clone()));
    
    // Verify counters are initialized to 0
    assert_eq!(client.get_total_dao(), 0);
    assert_eq!(client.get_total_vote(), 0);
}

#[test]
#[should_panic(expected = "Contract already initialized!")]
fn test_initialize_twice_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    // Initialize once
    client.initialize(&admin);
    
    // Try to initialize again - should panic
    let another_admin = Address::generate(&env);
    client.initialize(&another_admin);
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              CREATE DAO TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_create_dao() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let dao_owner = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    let dao_description = String::from_str(&env, "A test DAO for voting");
    let dao_deadline = 2000000u64; // Future timestamp
    
    // Create a DAO
    client.create_dao(&dao_name, &dao_description, &dao_owner, &dao_deadline);
    
    // Verify DAO was created
    let dao = client.get_dao(&dao_name);
    assert!(dao.is_some());
    
    let dao = dao.unwrap();
    assert_eq!(dao.dao_name, dao_name);
    assert_eq!(dao.dao_des, dao_description);
    assert_eq!(dao.dao_owner, dao_owner);
    assert_eq!(dao.dao_deadline, dao_deadline);
    assert_eq!(dao.yes, 0);
    assert_eq!(dao.no, 0);
    assert_eq!(dao.total_votes, 0);
    
    // Verify total DAO count increased
    assert_eq!(client.get_total_dao(), 1);
}

#[test]
fn test_create_multiple_daos() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    
    // Create first DAO
    client.create_dao(
        &String::from_str(&env, "DAO1"),
        &String::from_str(&env, "First DAO"),
        &owner1,
        &2000000u64,
    );
    
    // Create second DAO
    client.create_dao(
        &String::from_str(&env, "DAO2"),
        &String::from_str(&env, "Second DAO"),
        &owner2,
        &3000000u64,
    );
    
    // Verify both exist
    assert_eq!(client.get_total_dao(), 2);
    
    let all_daos = client.get_all_daos();
    assert_eq!(all_daos.len(), 2);
}

#[test]
#[should_panic(expected = "DAO already exists!")]
fn test_create_duplicate_dao_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create first DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "First DAO"),
        &owner,
        &2000000u64,
    );
    
    // Try to create with same name - should fail
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Duplicate DAO"),
        &owner,
        &2000000u64,
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              VOTE DAO TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_vote_dao_yes() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let voter = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Test"),
        &owner,
        &2000000u64,
    );
    
    // Vote yes
    client.vote_dao(&voter, &dao_name, &String::from_str(&env, "yes"));
    
    // Verify vote was recorded
    let dao = client.get_dao(&dao_name).unwrap();
    assert_eq!(dao.yes, 1);
    assert_eq!(dao.no, 0);
    assert_eq!(dao.total_votes, 1);
    
    // Verify voter is marked as having voted
    assert!(client.has_voted(&dao_name, &voter));
    
    // Verify total vote count
    assert_eq!(client.get_total_vote(), 1);
}

#[test]
fn test_vote_dao_no() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let voter = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Test"),
        &owner,
        &2000000u64,
    );
    
    // Vote no
    client.vote_dao(&voter, &dao_name, &String::from_str(&env, "no"));
    
    // Verify vote was recorded
    let dao = client.get_dao(&dao_name).unwrap();
    assert_eq!(dao.yes, 0);
    assert_eq!(dao.no, 1);
    assert_eq!(dao.total_votes, 1);
}

#[test]
fn test_multiple_voters() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Test"),
        &owner,
        &2000000u64,
    );
    
    // Multiple votes
    client.vote_dao(&voter1, &dao_name, &String::from_str(&env, "yes"));
    client.vote_dao(&voter2, &dao_name, &String::from_str(&env, "yes"));
    client.vote_dao(&voter3, &dao_name, &String::from_str(&env, "no"));
    
    // Verify votes
    let dao = client.get_dao(&dao_name).unwrap();
    assert_eq!(dao.yes, 2);
    assert_eq!(dao.no, 1);
    assert_eq!(dao.total_votes, 3);
    assert_eq!(client.get_total_vote(), 3);
}

#[test]
#[should_panic(expected = "DAO creator cannot vote on their own DAO!")]
fn test_owner_cannot_vote() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Test"),
        &owner,
        &2000000u64,
    );
    
    // Owner tries to vote - should fail
    client.vote_dao(&owner, &dao_name, &String::from_str(&env, "yes"));
}

#[test]
#[should_panic(expected = "You have already voted on this DAO!")]
fn test_double_voting_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let voter = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Test"),
        &owner,
        &2000000u64,
    );
    
    // Vote once
    client.vote_dao(&voter, &dao_name, &String::from_str(&env, "yes"));
    
    // Try to vote again - should fail
    client.vote_dao(&voter, &dao_name, &String::from_str(&env, "no"));
}

#[test]
#[should_panic(expected = "Invalid choice!")]
fn test_invalid_vote_choice_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let voter = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Test"),
        &owner,
        &2000000u64,
    );
    
    // Invalid vote choice
    client.vote_dao(&voter, &dao_name, &String::from_str(&env, "maybe"));
}

#[test]
#[should_panic(expected = "DAO not found!")]
fn test_vote_nonexistent_dao_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let voter = Address::generate(&env);
    
    // Try to vote on non-existent DAO
    client.vote_dao(&voter, &String::from_str(&env, "NonExistent"), &String::from_str(&env, "yes"));
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              UPDATE DAO TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_update_dao() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Original description"),
        &owner,
        &2000000u64,
    );
    
    // Update DAO
    let new_description = String::from_str(&env, "Updated description");
    let new_deadline = 3000000u64;
    client.update_dao(&owner, &dao_name, &new_description, &new_deadline);
    
    // Verify update
    let dao = client.get_dao(&dao_name).unwrap();
    assert_eq!(dao.dao_des, new_description);
    assert_eq!(dao.dao_deadline, new_deadline);
}

#[test]
#[should_panic(expected = "Only DAO owner can update!")]
fn test_non_owner_cannot_update() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let non_owner = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Original"),
        &owner,
        &2000000u64,
    );
    
    // Non-owner tries to update - should fail
    client.update_dao(&non_owner, &dao_name, &String::from_str(&env, "Hacked"), &3000000u64);
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              DELETE DAO TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_delete_dao() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Test"),
        &owner,
        &2000000u64,
    );
    
    // Verify it exists
    assert!(client.get_dao(&dao_name).is_some());
    assert_eq!(client.get_all_daos().len(), 1);
    
    // Delete DAO
    client.delete_dao(&owner, &dao_name);
    
    // Verify it's gone
    assert!(client.get_dao(&dao_name).is_none());
    assert_eq!(client.get_all_daos().len(), 0);
}

#[test]
#[should_panic(expected = "Only DAO owner can delete!")]
fn test_non_owner_cannot_delete() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let non_owner = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Test"),
        &owner,
        &2000000u64,
    );
    
    // Non-owner tries to delete - should fail
    client.delete_dao(&non_owner, &dao_name);
}

#[test]
#[should_panic(expected = "DAO not found!")]
fn test_delete_nonexistent_dao_fails() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    
    // Try to delete non-existent DAO
    client.delete_dao(&owner, &String::from_str(&env, "NonExistent"));
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              VIEW FUNCTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_get_all_daos() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    // Initially empty
    assert_eq!(client.get_all_daos().len(), 0);
    
    let owner = Address::generate(&env);
    
    // Create 3 DAOs
    client.create_dao(&String::from_str(&env, "DAO1"), &String::from_str(&env, "First"), &owner, &2000000u64);
    client.create_dao(&String::from_str(&env, "DAO2"), &String::from_str(&env, "Second"), &owner, &2000000u64);
    client.create_dao(&String::from_str(&env, "DAO3"), &String::from_str(&env, "Third"), &owner, &2000000u64);
    
    let all_daos = client.get_all_daos();
    assert_eq!(all_daos.len(), 3);
}

#[test]
fn test_get_dao() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Non-existent DAO
    assert!(client.get_dao(&dao_name).is_none());
    
    // Create and get
    client.create_dao(&dao_name, &String::from_str(&env, "Test"), &owner, &2000000u64);
    
    let dao = client.get_dao(&dao_name);
    assert!(dao.is_some());
    assert_eq!(dao.unwrap().dao_name, dao_name);
}

#[test]
fn test_has_voted() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let voter = Address::generate(&env);
    let dao_name = String::from_str(&env, "TestDAO");
    
    // Create DAO
    client.create_dao(&dao_name, &String::from_str(&env, "Test"), &owner, &2000000u64);
    
    // Before voting
    assert!(!client.has_voted(&dao_name, &voter));
    
    // After voting
    client.vote_dao(&voter, &dao_name, &String::from_str(&env, "yes"));
    assert!(client.has_voted(&dao_name, &voter));
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_full_dao_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();
    
    let contract_id = env.register(VoteContract, ());
    let client = VoteContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    
    client.initialize(&admin);
    
    let owner = Address::generate(&env);
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);
    let dao_name = String::from_str(&env, "CommunityDAO");
    
    // 1. Create DAO
    client.create_dao(
        &dao_name,
        &String::from_str(&env, "Community governance"),
        &owner,
        &2000000u64,
    );
    
    // 2. Multiple users vote
    client.vote_dao(&voter1, &dao_name, &String::from_str(&env, "yes"));
    client.vote_dao(&voter2, &dao_name, &String::from_str(&env, "yes"));
    client.vote_dao(&voter3, &dao_name, &String::from_str(&env, "no"));
    
    // 3. Check results
    let dao = client.get_dao(&dao_name).unwrap();
    assert_eq!(dao.yes, 2);
    assert_eq!(dao.no, 1);
    assert_eq!(dao.total_votes, 3);
    
    // 4. Owner updates DAO
    client.update_dao(
        &owner,
        &dao_name,
        &String::from_str(&env, "Updated community governance"),
        &3000000u64,
    );
    
    // 5. Verify stats
    assert_eq!(client.get_total_dao(), 1);
    assert_eq!(client.get_total_vote(), 3);
}
