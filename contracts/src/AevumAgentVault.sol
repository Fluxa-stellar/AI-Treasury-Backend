// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20
 * @notice Minimal interface for standard ERC-20 token interactions.
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function name() external view returns (string memory);
}

/**
 * @title AevumAgentVault
 * @notice Programmable AI Treasury Vault for Aevum Testnet (QDay.io).
 * @dev Enforces granular, per-agent spending quotas, rolling reset windows,
 *      and optional recipient whitelists for autonomous AI agent payments using tUSD8.
 */
contract AevumAgentVault {
    // ==================== State Variables ====================

    address public owner;
    bool public paused;
    IERC20 public immutable tusd8;

    struct AgentConfig {
        bool isAuthorized;
        uint256 periodSpendingLimit; // Maximum total spend allowed per period
        uint256 maxTxAmount;         // Maximum spend allowed in a single transaction
        uint256 periodDuration;      // Duration of reset window in seconds (e.g. 86400 for 1 day)
        uint256 currentPeriodSpent;  // Total spent in current period
        uint256 periodStart;         // Start timestamp of active period
        bool enforceWhitelist;       // If true, payments can only go to approved recipients
    }

    /// @notice Agent configuration by address
    mapping(address => AgentConfig) public agentConfigs;

    /// @notice Whitelist of approved recipients per agent: agent => recipient => isApproved
    mapping(address => mapping(address => bool)) public agentApprovedRecipients;

    // ==================== Events ====================

    event Deposit(address indexed sender, uint256 amount);
    event Withdraw(address indexed owner, uint256 amount);
    event AgentConfigured(
        address indexed agent,
        uint256 periodSpendingLimit,
        uint256 maxTxAmount,
        uint256 periodDuration,
        bool enforceWhitelist
    );
    event AgentRevoked(address indexed agent);
    event AgentRecipientUpdated(address indexed agent, address indexed recipient, bool approved);
    event AgentPaymentSettled(
        address indexed agent,
        address indexed recipient,
        uint256 amount,
        string memo,
        uint256 timestamp
    );
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ==================== Errors ====================

    error NotOwner();
    error ContractPaused();
    error NotAuthorizedAgent();
    error InvalidAddress();
    error InvalidAmount();
    error ExceedsTxLimit(uint256 requested, uint256 maxAllowed);
    error ExceedsPeriodLimit(uint256 requested, uint256 remaining);
    error RecipientNotApproved(address recipient);
    error InsufficientVaultBalance(uint256 requested, uint256 available);
    error TransferFailed();

    // ==================== Modifiers ====================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyAuthorizedAgent() {
        if (!agentConfigs[msg.sender].isAuthorized) revert NotAuthorizedAgent();
        _;
    }

    // ==================== Constructor ====================

    /**
     * @param _tusd8 Address of the tUSD8 ERC20 stablecoin on Aevum Testnet.
     */
    constructor(address _tusd8) {
        if (_tusd8 == address(0)) revert InvalidAddress();
        owner = msg.sender;
        tusd8 = IERC20(_tusd8);
    }

    // ==================== Owner Management ====================

    /**
     * @notice Deposit tUSD8 into the treasury vault.
     * @param amount Amount of tUSD8 (in base units, 6 decimals).
     */
    function deposit(uint256 amount) external whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        bool success = tusd8.transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();
        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice Withdraw tUSD8 from the treasury vault back to the owner.
     * @param amount Amount of tUSD8 to withdraw.
     */
    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();
        uint256 balance = tusd8.balanceOf(address(this));
        if (amount > balance) revert InsufficientVaultBalance(amount, balance);

        bool success = tusd8.transfer(owner, amount);
        if (!success) revert TransferFailed();
        emit Withdraw(owner, amount);
    }

    /**
     * @notice Authorize or update budget constraints for an AI agent.
     * @param agent Address of the autonomous agent.
     * @param periodSpendingLimit Maximum tUSD8 spendable per reset cycle.
     * @param maxTxAmount Single-transaction ceiling for safety.
     * @param periodDuration Duration in seconds (e.g., 86400 for 1 day).
     * @param enforceWhitelist Whether the agent is restricted to approved recipients.
     */
    function setAgentConfig(
        address agent,
        uint256 periodSpendingLimit,
        uint256 maxTxAmount,
        uint256 periodDuration,
        bool enforceWhitelist
    ) external onlyOwner {
        if (agent == address(0)) revert InvalidAddress();
        if (maxTxAmount > periodSpendingLimit) revert InvalidAmount();
        if (periodDuration == 0) revert InvalidAmount();

        agentConfigs[agent] = AgentConfig({
            isAuthorized: true,
            periodSpendingLimit: periodSpendingLimit,
            maxTxAmount: maxTxAmount,
            periodDuration: periodDuration,
            currentPeriodSpent: 0,
            periodStart: block.timestamp,
            enforceWhitelist: enforceWhitelist
        });

        emit AgentConfigured(agent, periodSpendingLimit, maxTxAmount, periodDuration, enforceWhitelist);
    }

    /**
     * @notice Revoke an AI agent's access immediately.
     */
    function revokeAgent(address agent) external onlyOwner {
        agentConfigs[agent].isAuthorized = false;
        emit AgentRevoked(agent);
    }

    /**
     * @notice Add or remove an approved payment recipient for a specific agent.
     */
    function setAgentRecipient(
        address agent,
        address recipient,
        bool approved
    ) external onlyOwner {
        if (agent == address(0) || recipient == address(0)) revert InvalidAddress();
        agentApprovedRecipients[agent][recipient] = approved;
        emit AgentRecipientUpdated(agent, recipient, approved);
    }

    /**
     * @notice Pause vault operations during emergencies.
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Resume vault operations.
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @notice Transfer vault ownership.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ==================== Agent Operations ====================

    /**
     * @notice Execute an autonomous agent payment within strictly enforced on-chain limits.
     * @param recipient Address receiving the tUSD8 payment.
     * @param amount Amount in tUSD8 (6 decimals).
     * @param memo Human-readable or hash identifier describing the purpose (e.g. "API compute refill").
     */
    function executeAgentPayment(
        address recipient,
        uint256 amount,
        string calldata memo
    ) external onlyAuthorizedAgent whenNotPaused returns (bool) {
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        AgentConfig storage config = agentConfigs[msg.sender];

        // 1. Check single-transaction limit
        if (amount > config.maxTxAmount) {
            revert ExceedsTxLimit(amount, config.maxTxAmount);
        }

        // 2. Check recipient whitelist if enforced
        if (config.enforceWhitelist && !agentApprovedRecipients[msg.sender][recipient]) {
            revert RecipientNotApproved(recipient);
        }

        // 3. Refresh rolling period if elapsed
        if (block.timestamp >= config.periodStart + config.periodDuration) {
            config.currentPeriodSpent = 0;
            config.periodStart = block.timestamp;
        }

        // 4. Check remaining period allowance
        uint256 remaining = config.periodSpendingLimit > config.currentPeriodSpent
            ? config.periodSpendingLimit - config.currentPeriodSpent
            : 0;

        if (amount > remaining) {
            revert ExceedsPeriodLimit(amount, remaining);
        }

        // 5. Check vault balance
        uint256 balance = tusd8.balanceOf(address(this));
        if (amount > balance) {
            revert InsufficientVaultBalance(amount, balance);
        }

        // 6. Update state before external transfer (Checks-Effects-Interactions)
        config.currentPeriodSpent += amount;

        // 7. Settle payment
        bool success = tusd8.transfer(recipient, amount);
        if (!success) revert TransferFailed();

        emit AgentPaymentSettled(msg.sender, recipient, amount, memo, block.timestamp);
        return true;
    }

    // ==================== View Functions ====================

    /**
     * @notice Get current status, remaining budget, and reset countdown for an agent.
     */
    function getAgentStatus(address agent)
        external
        view
        returns (
            bool isAuthorized,
            uint256 periodSpendingLimit,
            uint256 maxTxAmount,
            uint256 currentPeriodSpent,
            uint256 remainingInPeriod,
            uint256 nextResetTimestamp
        )
    {
        AgentConfig memory config = agentConfigs[agent];
        if (!config.isAuthorized) {
            return (false, 0, 0, 0, 0, 0);
        }

        uint256 effectiveSpent = config.currentPeriodSpent;
        if (block.timestamp >= config.periodStart + config.periodDuration) {
            effectiveSpent = 0;
        }

        uint256 remaining = config.periodSpendingLimit > effectiveSpent
            ? config.periodSpendingLimit - effectiveSpent
            : 0;

        uint256 nextReset = config.periodStart + config.periodDuration;

        return (
            true,
            config.periodSpendingLimit,
            config.maxTxAmount,
            effectiveSpent,
            remaining,
            nextReset
        );
    }

    /**
     * @notice Get the total tUSD8 balance stored in this vault.
     */
    function getVaultBalance() external view returns (uint256) {
        return tusd8.balanceOf(address(this));
    }
}

