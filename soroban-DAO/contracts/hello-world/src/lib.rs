#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, 
    symbol_short, token, Address, Env, String, Symbol, Vec,
};

// ═══════════════════════════════════════════════════════════════════════════════
//                              STORAGE KEYS (DataKey Enum)
// ═══════════════════════════════════════════════════════════════════════════════
// 
// WHY ENUM FOR STORAGE KEYS?
// --------------------------
// In Rust/Soroban, enums are MUCH more powerful than JS/Python enums!
// 
// JavaScript/Python enum: Just fixed labels
//   enum Gender { MALE, FEMALE }  → Just 0 or 1
// 
// Rust enum: Can hold DATA inside each variant!
//   enum DataKey { 
//       DaoNames,           → A simple label (like JS enum)
//       DaoRecord(String)   → A label WITH a String parameter!
//   }
// 
// This means DaoRecord("TechDAO") and DaoRecord("ArtDAO") are DIFFERENT keys!
//
// ═══════════════════════════════════════════════════════════════════════════════

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    // DAO Storage
    DaoNames,           // Stores Vec<String> - list of all DAO names (the INDEX)
    DaoRecord(String),  // Stores DAORecord - each DAO has its own key
    
    // Voting Tracker (Prevent Double Voting)
    HasVoted(String, Address),  // (dao_name, voter_address) -> true if voted
    
    // Global Variables (Admin & Counters)
    Admin,              // Stores Address - the admin who can withdraw donations
    TotalDao,           // Stores u64 - total number of DAOs created
    TotalVote,          // Stores u64 - total number of votes across all DAOs
    TotalDonate,        // Stores i128 - total amount of native tokens donated
}


// ═══════════════════════════════════════════════════════════════════════════════
//                              TTL CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
// TTL is measured in LEDGERS (1 ledger ≈ 5-6 seconds)
// ~17,280 ledgers ≈ 1 day
// ~120,960 ledgers ≈ 1 week
// ~518,400 ledgers ≈ 1 month

const DAY_IN_LEDGERS: u32 = 17_280;
const WEEK_IN_LEDGERS: u32 = 120_960;
const MONTH_IN_LEDGERS: u32 = 518_400;
const SIX_MONTHS_IN_LEDGERS: u32 = 3_110_400;  // Better threshold! Users pay less per extension
const YEAR_IN_LEDGERS: u32 = 6_307_200;

// TTL STRATEGY:
// - Threshold = 6 months: If TTL drops below 6 months, extend it
// - Extend to = 1 year: Extend TTL to 1 year
// - This means: User pays for ~6 months extension (smaller fee)

// ═══════════════════════════════════════════════════════════════════════════════
//                         VOTER RECORD
// ═══════════════════════════════════════════════════════════════════════════════

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DAORecord {
    pub dao_name: String,
    pub dao_des: String,
    pub dao_owner: Address,
    pub dao_deadline: u64,
    pub yes: u64,
    pub no: u64,
    pub total_votes: u64,
}

// ═══════════════════════════════════════════════════════════════════════════════
//                              MAIN CONTRACT
// ═══════════════════════════════════════════════════════════════════════════════

#[contract]
pub struct VoteContract;

#[contractimpl]
impl VoteContract {
    
    // ─────────────────────────────────────────────────────────────────────────
    //                     INITIALIZE (CONSTRUCTOR)
    // ─────────────────────────────────────────────────────────────────────────
    /// Initialize the contract with an admin address
    /// This MUST be called once after deployment
    /// The admin is the ONLY one who can withdraw donated funds
    pub fn initialize(env: Env, admin: Address) {
        // Check if already initialized
        let existing_admin: Option<Address> = env.storage()
            .instance()
            .get(&DataKey::Admin);
        assert!(existing_admin.is_none(), "Contract already initialized!");
        
        // Set the admin
        env.storage()
            .instance()
            .set(&DataKey::Admin, &admin);
        
        // Initialize counters to 0
        env.storage()
            .instance()
            .set(&DataKey::TotalDao, &0u64);
        
        env.storage()
            .instance()
            .set(&DataKey::TotalVote, &0u64);
        
        env.storage()
            .instance()
            .set(&DataKey::TotalDonate, &0i128);
        
        // Extend TTL
        env.storage().instance().extend_ttl(
            SIX_MONTHS_IN_LEDGERS,
            YEAR_IN_LEDGERS
        );
        
        // ═══════════════════════════════════════════════════════════════════
        // EMIT EVENT: Contract Initialized
        // ═══════════════════════════════════════════════════════════════════
        env.events().publish(
            (symbol_short!("init"), symbol_short!("admin")),
            admin
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    //                     CREATE DAO FUNCTION
    // ─────────────────────────────────────────────────────────────────────────
    pub fn create_dao(env: Env, dao_name: String, dao_des: String, dao_owner: Address, dao_deadline: u64) {
       
        dao_owner.require_auth();
        
        assert!(dao_deadline >= env.ledger().timestamp(), "Deadline must be in the future");
        
        // ═══════════════════════════════════════════════════════════════════
        // Check if DAO already exists using DataKey::DaoRecord(name)
        // ═══════════════════════════════════════════════════════════════════
        let existing: Option<DAORecord> = env.storage()
            .persistent()
            .get(&DataKey::DaoRecord(dao_name.clone()));
        assert!(existing.is_none(), "DAO already exists!, try different name.");
        
        let record = DAORecord {
            dao_name: dao_name.clone(),
            dao_des: dao_des.clone(),
            dao_owner: dao_owner.clone(),
            dao_deadline: dao_deadline,
            yes: 0,
            no: 0,
            total_votes: 0,
        };
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Save the DAO record with its unique key
        // Key: DataKey::DaoRecord("TechDAO") → Value: DAORecord
        // ═══════════════════════════════════════════════════════════════════
        env.storage()
            .persistent()
            .set(&DataKey::DaoRecord(dao_name.clone()), &record);
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Add the DAO name to our INDEX (DataKey::DaoNames)
        // This is how we can later retrieve ALL DAOs!
        // ═══════════════════════════════════════════════════════════════════
        let mut dao_names: Vec<String> = env.storage()
            .persistent()
            .get(&DataKey::DaoNames)
            .unwrap_or(Vec::new(&env));
        
        dao_names.push_back(dao_name.clone());
        
        env.storage()
            .persistent()
            .set(&DataKey::DaoNames, &dao_names);
        
        // ═══════════════════════════════════════════════════════════════════
        //                     SET TTL FOR DAO RECORD
        // ═══════════════════════════════════════════════════════════════════
        env.storage().persistent().extend_ttl(
            &DataKey::DaoRecord(dao_name.clone()), 
            SIX_MONTHS_IN_LEDGERS,
            YEAR_IN_LEDGERS
        );
        
        // Extend TTL for the index too
        env.storage().persistent().extend_ttl(
            &DataKey::DaoNames, 
            SIX_MONTHS_IN_LEDGERS,
            YEAR_IN_LEDGERS
        );
        
        // ═══════════════════════════════════════════════════════════════════
        //                     EXTEND INSTANCE TTL FOR CONTRACT
        // ═══════════════════════════════════════════════════════════════════
        env.storage().instance().extend_ttl(
            SIX_MONTHS_IN_LEDGERS,
            YEAR_IN_LEDGERS
        );
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Increment TOTAL_DAO counter
        // ═══════════════════════════════════════════════════════════════════
        let total_dao: u64 = env.storage()
            .instance()
            .get(&DataKey::TotalDao)
            .unwrap_or(0);
        
        env.storage()
            .instance()
            .set(&DataKey::TotalDao, &(total_dao + 1));
        
        // ═══════════════════════════════════════════════════════════════════
        // EMIT EVENT: DAO Created
        // ═══════════════════════════════════════════════════════════════════
        env.events().publish(
            (symbol_short!("dao"), symbol_short!("created")),
            (dao_name, dao_owner, dao_deadline)
        );

        // env.events().publish(
        //     TOPICS,      // First tuple - for FILTERING/SEARCHING
        //     DATA         // Second tuple - the actual EVENT DATA
        // );

        // Real Example

        // // Your event:
        // env.events().publish(
        //     (symbol_short!("dao"), symbol_short!("created")),  // TOPICS
        //     (dao_name, dao_owner, dao_deadline)                 // DATA
        // );

        // Stored in Stellar as:

        // json
        // {
        //     "topics": ["dao", "created"],
        //     "data": {
        //         "dao_name": "TechDAO",
        //         "dao_owner": "GA...XYZ",
        //         "dao_deadline": 1700000000
        //     }
        // }

        // Frontend JavaScript to filter:

        // Get ALL dao events
        // events.filter(e => e.topics[0] === "dao")
        // Get only "created" dao events
        // events.filter(e => e.topics[0] === "dao" && e.topics[1] === "created")
        // Get only "deleted" dao events  
        // events.filter(e => e.topics[0] === "dao" && e.topics[1] === "deleted")

    }

    // ─────────────────────────────────────────────────────────────────────────
    //                     VOTE DAO FUNCTION
    // ─────────────────────────────────────────────────────────────────────────
    /// Vote on a DAO proposal
    /// - voter: The address of the person voting (must sign transaction)
    /// - dao_name: Name of the DAO to vote on
    /// - choice: "yes" or "no"
    /// 
    /// RULES:
    /// 1. Voter must authenticate (sign the transaction)
    /// 2. DAO creator CANNOT vote on their own DAO
    /// 3. Voting must be before deadline
    /// 4. Each voter can only vote ONCE per DAO (no double voting!)
    pub fn vote_dao(env: Env, voter: Address, dao_name: String, choice: String) {
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Require voter to authenticate (sign the transaction)
        // ═══════════════════════════════════════════════════════════════════
        voter.require_auth();
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Fetch the DAO record
        // ═══════════════════════════════════════════════════════════════════
        let dao_record: Option<DAORecord> = env.storage()
            .persistent()
            .get(&DataKey::DaoRecord(dao_name.clone()));
        
        assert!(dao_record.is_some(), "DAO not found!");
        let mut dao_record = dao_record.unwrap();
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Check if voter is the DAO creator (NOT ALLOWED!)
        // ═══════════════════════════════════════════════════════════════════
        assert!(voter != dao_record.dao_owner, "DAO creator cannot vote on their own DAO!");
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 4: Check if voter has already voted (PREVENT DOUBLE VOTING!)
        // ═══════════════════════════════════════════════════════════════════
        let vote_key = DataKey::HasVoted(dao_name.clone(), voter.clone());
        let has_voted: bool = env.storage()
            .persistent()
            .has(&vote_key);
        
        assert!(!has_voted, "You have already voted on this DAO!");
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 5: Check deadline
        // ═══════════════════════════════════════════════════════════════════
        assert!(dao_record.dao_deadline > env.ledger().timestamp(), "DAO deadline has passed!");
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 6: Process the vote
        // ═══════════════════════════════════════════════════════════════════
        if choice == String::from_str(&env, "yes") {
            dao_record.yes += 1;
        } else if choice == String::from_str(&env, "no") {
            dao_record.no += 1;
        } else {
            panic!("Invalid choice! Use 'yes' or 'no'");
        }

        dao_record.total_votes += 1;
        
        // Save back using DataKey::DaoRecord(name)
        env.storage()
            .persistent()
            .set(&DataKey::DaoRecord(dao_name.clone()), &dao_record);
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 7: Mark voter as having voted (PREVENT FUTURE DOUBLE VOTING!)
        // ═══════════════════════════════════════════════════════════════════
        env.storage()
            .persistent()
            .set(&vote_key, &true);
        
        // Extend TTL for the vote record
        env.storage().persistent().extend_ttl(
            &vote_key,
            SIX_MONTHS_IN_LEDGERS,
            YEAR_IN_LEDGERS
        );
        
        env.storage().instance().extend_ttl(
            SIX_MONTHS_IN_LEDGERS,
            YEAR_IN_LEDGERS
        );
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 8: Increment TOTAL_VOTE counter
        // ═══════════════════════════════════════════════════════════════════
        let total_vote: u64 = env.storage()
            .instance()
            .get(&DataKey::TotalVote)
            .unwrap_or(0);
        
        env.storage()
            .instance()
            .set(&DataKey::TotalVote, &(total_vote + 1));
        
        // ═══════════════════════════════════════════════════════════════════
        // EMIT EVENT: Vote Cast
        // ═══════════════════════════════════════════════════════════════════
        env.events().publish(
            (symbol_short!("vote"), symbol_short!("cast")),
            (dao_name, voter, choice)
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    //                     UPDATE DAO FUNCTION
    // ─────────────────────────────────────────────────────────────────────────
    /// Update a DAO's description and/or deadline
    /// Only the DAO owner can update their DAO
    pub fn update_dao(
        env: Env, 
        dao_owner: Address, 
        dao_name: String, 
        new_description: String, 
        new_deadline: u64
    ) {
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Owner must authenticate
        // ═══════════════════════════════════════════════════════════════════
        dao_owner.require_auth();
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Fetch the existing DAO
        // ═══════════════════════════════════════════════════════════════════
        let dao_record: Option<DAORecord> = env.storage()
            .persistent()
            .get(&DataKey::DaoRecord(dao_name.clone()));
        
        assert!(dao_record.is_some(), "DAO not found!");
        let mut dao_record = dao_record.unwrap();
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Verify caller is the owner
        // ═══════════════════════════════════════════════════════════════════
        assert!(dao_owner == dao_record.dao_owner, "Only DAO owner can update!");
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 4: Validate new deadline
        // ═══════════════════════════════════════════════════════════════════
        assert!(new_deadline >= env.ledger().timestamp(), "Deadline must be in the future");
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 5: Update the record
        // ═══════════════════════════════════════════════════════════════════
        dao_record.dao_des = new_description;
        dao_record.dao_deadline = new_deadline;
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 6: Save back to storage
        // ═══════════════════════════════════════════════════════════════════
        env.storage()
            .persistent()
            .set(&DataKey::DaoRecord(dao_name.clone()), &dao_record);
        
        // Extend TTL
        env.storage().persistent().extend_ttl(
            &DataKey::DaoRecord(dao_name.clone()), 
            SIX_MONTHS_IN_LEDGERS,
            YEAR_IN_LEDGERS
        );
        
        // ═══════════════════════════════════════════════════════════════════
        // EMIT EVENT: DAO Updated
        // ═══════════════════════════════════════════════════════════════════
        env.events().publish(
            (symbol_short!("dao"), symbol_short!("updated")),
            (dao_name, new_deadline)
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    //                     DELETE DAO FUNCTION
    // ─────────────────────────────────────────────────────────────────────────
    /// Delete a DAO completely
    /// Only the DAO owner can delete their DAO
    /// This removes both the record AND the name from the index
    pub fn delete_dao(env: Env, dao_owner: Address, dao_name: String) {
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Owner must authenticate
        // ═══════════════════════════════════════════════════════════════════
        dao_owner.require_auth();
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Fetch the existing DAO
        // ═══════════════════════════════════════════════════════════════════
        let dao_record: Option<DAORecord> = env.storage()
            .persistent()
            .get(&DataKey::DaoRecord(dao_name.clone()));
        
        assert!(dao_record.is_some(), "DAO not found!");
        let dao_record = dao_record.unwrap();
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Verify caller is the owner
        // ═══════════════════════════════════════════════════════════════════
        assert!(dao_owner == dao_record.dao_owner, "Only DAO owner can delete!");
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 4: Remove the DAO record from storage
        // ═══════════════════════════════════════════════════════════════════
        env.storage()
            .persistent()
            .remove(&DataKey::DaoRecord(dao_name.clone()));
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 5: Remove the name from the INDEX (DaoNames)
        // We need to rebuild the Vec without this name
        // ═══════════════════════════════════════════════════════════════════
        let dao_names: Vec<String> = env.storage()
            .persistent()
            .get(&DataKey::DaoNames)
            .unwrap_or(Vec::new(&env));
        
        // Create new Vec without the deleted DAO name
        let mut new_dao_names: Vec<String> = Vec::new(&env);
        for name in dao_names.iter() {
            if name != dao_name {
                new_dao_names.push_back(name);
            }
        }
        
        // Save the updated index
        env.storage()
            .persistent()
            .set(&DataKey::DaoNames, &new_dao_names);
        
        // ═══════════════════════════════════════════════════════════════════
        // EMIT EVENT: DAO Deleted
        // ═══════════════════════════════════════════════════════════════════
        env.events().publish(
            (symbol_short!("dao"), symbol_short!("deleted")),
            (dao_name, dao_owner)
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    //                     VIEW FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    
    /// Get ALL DAOs by iterating through the index
    /// 
    /// HOW IT WORKS:
    /// 1. Fetch DataKey::DaoNames → ["TechDAO", "ArtDAO", "GameDAO"]
    /// 2. For each name, fetch DataKey::DaoRecord(name) → DAORecord
    /// 3. Return all records
    pub fn get_all_daos(env: Env) -> Vec<DAORecord> {
        // Step 1: Get the index (list of all DAO names)
        let dao_names: Vec<String> = env.storage()
            .persistent()
            .get(&DataKey::DaoNames)
            .unwrap_or(Vec::new(&env));
        
        // Step 2: Iterate through names and collect records
        let mut records: Vec<DAORecord> = Vec::new(&env);
        
        for name in dao_names.iter() {
            let dao_record: Option<DAORecord> = env.storage()
                .persistent()
                .get(&DataKey::DaoRecord(name.clone()));
            
            // Only push if record exists (safe approach)
            if let Some(record) = dao_record {
                records.push_back(record);
            }
        }
        
        records
    }

    /// Get a single DAO by name
    pub fn get_dao(env: Env, dao_name: String) -> Option<DAORecord> {
        env.storage()
            .persistent()
            .get(&DataKey::DaoRecord(dao_name))
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    //                     DONATION FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────────
    
    /// Donate native tokens (XLM) to this contract
    /// Anyone can call this function to donate
    /// 
    /// Parameters:
    /// - donor: The address donating (must sign)
    /// - token_address: The native XLM token contract address
    /// - amount: Amount to donate (in stroops, 1 XLM = 10^7 stroops)
    pub fn donate(env: Env, donor: Address, token_address: Address, amount: i128) {
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Donor must authenticate
        // ═══════════════════════════════════════════════════════════════════
        donor.require_auth();
        
        assert!(amount > 0, "Donation amount must be greater than 0");
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Transfer tokens from donor to this contract
        // ═══════════════════════════════════════════════════════════════════
        let token_client = token::Client::new(&env, &token_address);
        let contract_address = env.current_contract_address();
        
        // Transfer from donor to contract
        token_client.transfer(&donor, &contract_address, &amount);
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Update TOTAL_DONATE counter
        // ═══════════════════════════════════════════════════════════════════
        let total_donate: i128 = env.storage()
            .instance()
            .get(&DataKey::TotalDonate)
            .unwrap_or(0);
        
        env.storage()
            .instance()
            .set(&DataKey::TotalDonate, &(total_donate + amount));
        
        // Extend TTL
        env.storage().instance().extend_ttl(
            SIX_MONTHS_IN_LEDGERS,
            YEAR_IN_LEDGERS
        );
        
        // ═══════════════════════════════════════════════════════════════════
        // EMIT EVENT: Donation Received
        // ═══════════════════════════════════════════════════════════════════
        env.events().publish(
            (symbol_short!("donate"), symbol_short!("receive")),
            (donor, amount)
        );
    }
    
    /// Withdraw all donated funds from the contract
    /// ONLY the admin can call this function!
    /// 
    /// Parameters:
    /// - admin: The admin address (must match stored admin, must sign)
    /// - token_address: The native XLM token contract address
    /// - recipient: Where to send the funds (usually admin's address)
    /// - amount: Amount to withdraw
    pub fn withdraw(env: Env, admin: Address, token_address: Address, recipient: Address, amount: i128) {
        // ═══════════════════════════════════════════════════════════════════
        // STEP 1: Admin must authenticate
        // ═══════════════════════════════════════════════════════════════════
        admin.require_auth();
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 2: Verify caller is the admin
        // ═══════════════════════════════════════════════════════════════════
        let stored_admin: Address = env.storage()
            .instance()
            .get(&DataKey::Admin).unwrap();
        
        assert!(admin == stored_admin, "Only admin can withdraw!");
        
        assert!(amount > 0, "Withdrawal amount must be greater than 0");
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 3: Transfer tokens from contract to recipient
        // ═══════════════════════════════════════════════════════════════════
        let token_client = token::Client::new(&env, &token_address);
        let contract_address = env.current_contract_address();
        
        // Transfer from contract to recipient
        token_client.transfer(&contract_address, &recipient, &amount);
        
        // ═══════════════════════════════════════════════════════════════════
        // STEP 4: Update TOTAL_DONATE (subtract withdrawn amount)
        // ═══════════════════════════════════════════════════════════════════
        let total_donate: i128 = env.storage()
            .instance()
            .get(&DataKey::TotalDonate)
            .unwrap_or(0);
        
        let new_total = if total_donate >= amount {
            total_donate - amount
        } else {
            0
        };
        
        env.storage()
            .instance()
            .set(&DataKey::TotalDonate, &new_total);
        
        // ═══════════════════════════════════════════════════════════════════
        // EMIT EVENT: Withdrawal Made
        // ═══════════════════════════════════════════════════════════════════
        env.events().publish(
            (symbol_short!("withdraw"), symbol_short!("made")),
            (recipient, amount)
        );
    }
    
    // ─────────────────────────────────────────────────────────────────────────
    //                     GETTER FUNCTIONS (VIEW)
    // ─────────────────────────────────────────────────────────────────────────
    
    /// Get the admin address
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
    }
    
    /// Get total number of DAOs created
    pub fn get_total_dao(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::TotalDao)
            .unwrap_or(0)
    }
    
    /// Get total number of votes across all DAOs
    pub fn get_total_vote(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::TotalVote)
            .unwrap_or(0)
    }
    
    /// Get total amount of donations received
    pub fn get_total_donate(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalDonate)
            .unwrap_or(0)
    }
    
    /// Get the contract's token balance
    /// This shows how much is currently held in the contract
    pub fn get_contract_balance(env: Env, token_address: Address) -> i128 {
        let token_client = token::Client::new(&env, &token_address);
        let contract_address = env.current_contract_address();
        token_client.balance(&contract_address)
    }
    
    /// Check if a voter has already voted on a specific DAO
    /// Returns true if they have voted, false if they haven't
    pub fn has_voted(env: Env, dao_name: String, voter: Address) -> bool {
        let vote_key = DataKey::HasVoted(dao_name, voter);
        env.storage()
            .persistent()
            .has(&vote_key)
    }
}