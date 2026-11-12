use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LookupMap, UnorderedSet};
use near_sdk::json_types::U128;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{
    env, near, near_bindgen, require, AccountId, BorshStorageKey, NearToken, PanicOnDefault, Promise,
};

#[derive(BorshSerialize, BorshStorageKey)]
#[borsh(crate = "near_sdk::borsh")]
enum StorageKey {
    Jobs,
    BuyerJobs,
    ProviderJobs,
    Verifiers,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, PartialEq, Debug)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub enum JobState {
    Funded,
    Assigned,
    Submitted,
    VerifiedPass,
    VerifiedFail,
    SettledPaid,
    Refunded,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone, Debug)]
#[borsh(crate = "near_sdk::borsh")]
#[serde(crate = "near_sdk::serde")]
pub struct Job {
    pub job_id: String,
    pub buyer_id: AccountId,
    pub provider_id: Option<AccountId>,
    pub verifier_id: AccountId,
    pub amount: NearToken,
    pub state: JobState,
    pub policy_hash: String,
    pub artifact_hash: Option<String>,
    pub evidence_hash: Option<String>,
    pub created_at_block: u64,
    pub deadline_block: u64,
    pub paid_at_block: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(crate = "near_sdk::serde")]
pub struct JobView {
    pub job_id: String,
    pub buyer_id: AccountId,
    pub provider_id: Option<AccountId>,
    pub verifier_id: AccountId,
    pub amount_yocto: U128,
    pub state: JobState,
    pub policy_hash: String,
    pub artifact_hash: Option<String>,
    pub evidence_hash: Option<String>,
    pub created_at_block: u64,
    pub deadline_block: u64,
    pub paid_at_block: Option<u64>,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct ProofRailContract {
    pub admin_id: AccountId,
    pub jobs: LookupMap<String, Job>,
    pub all_job_ids: UnorderedSet<String>,
    pub authorized_verifiers: UnorderedSet<AccountId>,
}

#[near]
impl ProofRailContract {
    #[init]
    pub fn new(admin_id: AccountId) -> Self {
        require!(!env::state_exists(), "Already initialized");
        let mut verifiers = UnorderedSet::new(StorageKey::Verifiers);
        verifiers.insert(&admin_id);

        Self {
            admin_id,
            jobs: LookupMap::new(StorageKey::Jobs),
            all_job_ids: UnorderedSet::new(StorageKey::BuyerJobs),
            authorized_verifiers: verifiers,
        }
    }

    /// Add an authorized verifier who is permitted to attest task outcomes
    pub fn add_verifier(&mut self, verifier_id: AccountId) {
        self.assert_admin();
        self.authorized_verifiers.insert(&verifier_id);
    }

    /// Buyer creates and funds an escrow job attached with NEAR deposit
    #[payable]
    pub fn create_funded_job(
        &mut self,
        job_id: String,
        provider_id: Option<AccountId>,
        verifier_id: AccountId,
        policy_hash: String,
        duration_blocks: u64,
    ) {
        let deposit = env::attached_deposit();
        require!(deposit > NearToken::from_yoctonear(0), "Deposit must be greater than zero");
        require!(self.jobs.get(&job_id).is_none(), "Job ID already exists");
        require!(
            self.authorized_verifiers.contains(&verifier_id),
            "Verifier must be authorized by ProofRail"
        );

        let buyer_id = env::predecessor_account_id();
        let current_block = env::block_height();
        let deadline_block = current_block + duration_blocks;

        let initial_state = if provider_id.is_some() {
            JobState::Assigned
        } else {
            JobState::Funded
        };

        let job = Job {
            job_id: job_id.clone(),
            buyer_id: buyer_id.clone(),
            provider_id,
            verifier_id,
            amount: deposit,
            state: initial_state,
            policy_hash,
            artifact_hash: None,
            evidence_hash: None,
            created_at_block: current_block,
            deadline_block,
            paid_at_block: None,
        };

        self.jobs.insert(&job_id, &job);
        self.all_job_ids.insert(&job_id);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofrail\",\"version\":\"1.0.0\",\"event\":\"job_created\",\"data\":{{\"job_id\":\"{}\",\"buyer\":\"{}\",\"amount\":\"{}\"}}}}",
            job_id, buyer_id, deposit.as_yoctonear()
        ));
    }

    /// Buyer assigns or updates the designated provider
    pub fn assign_provider(&mut self, job_id: String, provider_id: AccountId) {
        let mut job = self.get_job_internal(&job_id);
        require!(env::predecessor_account_id() == job.buyer_id, "Only buyer can assign provider");
        require!(
            job.state == JobState::Funded || job.state == JobState::Assigned,
            "Cannot assign provider in current state"
        );

        job.provider_id = Some(provider_id.clone());
        job.state = JobState::Assigned;
        self.jobs.insert(&job_id, &job);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofrail\",\"version\":\"1.0.0\",\"event\":\"provider_assigned\",\"data\":{{\"job_id\":\"{}\",\"provider\":\"{}\"}}}}",
            job_id, provider_id
        ));
    }

    /// Agent provider records deliverable submission with artifact SHA-256 hash
    pub fn record_submission(&mut self, job_id: String, artifact_hash: String) {
        let mut job = self.get_job_internal(&job_id);
        let caller = env::predecessor_account_id();

        require!(job.provider_id == Some(caller), "Only assigned provider can submit artifact");
        require!(job.state == JobState::Assigned, "Job not in assigned state");

        job.artifact_hash = Some(artifact_hash.clone());
        job.state = JobState::Submitted;
        self.jobs.insert(&job_id, &job);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofrail\",\"version\":\"1.0.0\",\"event\":\"artifact_submitted\",\"data\":{{\"job_id\":\"{}\",\"artifact_hash\":\"{}\"}}}}",
            job_id, artifact_hash
        ));
    }

    /// Designated verifier attests outcome based on independent test sandbox execution
    pub fn attest_verification(
        &mut self,
        job_id: String,
        passed: bool,
        evidence_hash: String,
    ) {
        let mut job = self.get_job_internal(&job_id);
        let caller = env::predecessor_account_id();

        require!(caller == job.verifier_id, "Only designated verifier can attest verification");
        require!(job.state == JobState::Submitted, "Job must have submitted artifact before verification");

        job.evidence_hash = Some(evidence_hash.clone());
        job.state = if passed {
            JobState::VerifiedPass
        } else {
            JobState::VerifiedFail
        };

        self.jobs.insert(&job_id, &job);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofrail\",\"version\":\"1.0.0\",\"event\":\"verification_attested\",\"data\":{{\"job_id\":\"{}\",\"passed\":{},\"evidence_hash\":\"{}\"}}}}",
            job_id, passed, evidence_hash
        ));
    }

    /// Release payment to provider on verified passing result
    pub fn settle_job(&mut self, job_id: String) -> Promise {
        let mut job = self.get_job_internal(&job_id);
        require!(
            job.state == JobState::VerifiedPass,
            "Job must have verified pass to settle payment"
        );
        let provider = job.provider_id.clone().expect("Provider missing");

        job.state = JobState::SettledPaid;
        job.paid_at_block = Some(env::block_height());
        self.jobs.insert(&job_id, &job);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofrail\",\"version\":\"1.0.0\",\"event\":\"job_settled\",\"data\":{{\"job_id\":\"{}\",\"provider\":\"{}\",\"amount\":\"{}\"}}}}",
            job_id, provider, job.amount.as_yoctonear()
        ));

        // Transfer funds directly to the verified provider
        Promise::new(provider).transfer(job.amount)
    }

    /// Refund buyer if deadline expired or verification failed
    pub fn refund_expired_job(&mut self, job_id: String) -> Promise {
        let mut job = self.get_job_internal(&job_id);
        let caller = env::predecessor_account_id();
        let current_block = env::block_height();

        let eligible = (current_block >= job.deadline_block && job.state != JobState::SettledPaid && job.state != JobState::Refunded)
            || job.state == JobState::VerifiedFail;

        require!(eligible, "Job is not eligible for refund");
        require!(
            caller == job.buyer_id || caller == self.admin_id,
            "Only buyer or admin can trigger refund"
        );

        job.state = JobState::Refunded;
        self.jobs.insert(&job_id, &job);

        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"proofrail\",\"version\":\"1.0.0\",\"event\":\"job_refunded\",\"data\":{{\"job_id\":\"{}\",\"buyer\":\"{}\",\"amount\":\"{}\"}}}}",
            job_id, job.buyer_id, job.amount.as_yoctonear()
        ));

        // Return escrowed deposit to buyer
        Promise::new(job.buyer_id).transfer(job.amount)
    }

    // View methods
    pub fn get_job(&self, job_id: String) -> Option<JobView> {
        self.jobs.get(&job_id).map(|j| JobView {
            job_id: j.job_id,
            buyer_id: j.buyer_id,
            provider_id: j.provider_id,
            verifier_id: j.verifier_id,
            amount_yocto: U128(j.amount.as_yoctonear()),
            state: j.state,
            policy_hash: j.policy_hash,
            artifact_hash: j.artifact_hash,
            evidence_hash: j.evidence_hash,
            created_at_block: j.created_at_block,
            deadline_block: j.deadline_block,
            paid_at_block: j.paid_at_block,
        })
    }

    pub fn list_jobs(&self, from_index: u64, limit: u64) -> Vec<JobView> {
        let ids: Vec<String> = self.all_job_ids.to_vec();
        ids.into_iter()
            .skip(from_index as usize)
            .take(limit as usize)
            .filter_map(|id| self.get_job(id))
            .collect()
    }

    fn get_job_internal(&self, job_id: &str) -> Job {
        self.jobs.get(&job_id.to_string()).expect("Job not found")
    }

    fn assert_admin(&self) {
        require!(env::predecessor_account_id() == self.admin_id, "Admin authorization required");
    }
}
