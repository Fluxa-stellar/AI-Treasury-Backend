// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TreasuryVault
 * @notice AI-Controlled Treasury Vault with strictly bounded on-chain security limits on BNB Chain.
 * @dev Owner defines spending limits, approved recipients, authorized AI agents, and allowed tokens.
 *      The AI agent can only execute transfers within configured constraints.
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

contract TreasuryVault {
    address public owner;
    bool public paused;

    uint256 public maxTransactionAmount;
    uint256 public dailySpendingLimit;
    uint256 public spentToday;
    uint256 public lastSpendingReset;

    mapping(address => bool) public authorizedAgents;
    mapping(address => bool) public approvedRecipients;
    mapping(address => bool) public allowedTokens;

    event Deposit(address indexed token, address indexed from, uint256 amount);
    event Withdraw(address indexed token, address indexed to, uint256 amount);
    event AgentTransferExecuted(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        address indexed agent
    );
    event AgentAuthorized(address indexed agent, bool authorized);
    event RecipientApproved(address indexed recipient, bool approved);
    event TokenAllowed(address indexed token, bool allowed);
    event LimitsUpdated(uint256 maxTransactionAmount, uint256 dailySpendingLimit);
    event Paused(address account);
    event Unpaused(address account);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "TreasuryVault: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "TreasuryVault: contract is paused");
        _;
    }

    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender], "TreasuryVault: caller is not an authorized agent");
        _;
    }

    constructor(
        uint256 _maxTransactionAmount,
        uint256 _dailySpendingLimit
    ) {
        owner = msg.sender;
        maxTransactionAmount = _maxTransactionAmount;
        dailySpendingLimit = _dailySpendingLimit;
        lastSpendingReset = block.timestamp;

        // Native BNB allowed by default (address(0))
        allowedTokens[address(0)] = true;
        emit TokenAllowed(address(0), true);
    }

    receive() external payable {
        emit Deposit(address(0), msg.sender, msg.value);
    }

    // ==================== Owner Operations ====================

    function depositBNB() external payable whenNotPaused {
        require(msg.value > 0, "TreasuryVault: zero deposit");
        emit Deposit(address(0), msg.sender, msg.value);
    }

    function depositToken(address token, uint256 amount) external whenNotPaused {
        require(token != address(0), "TreasuryVault: invalid token");
        require(amount > 0, "TreasuryVault: zero amount");
        require(allowedTokens[token], "TreasuryVault: token not allowed");

        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "TreasuryVault: transferFrom failed");

        emit Deposit(token, msg.sender, amount);
    }

    function withdrawBNB(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "TreasuryVault: insufficient balance");
        (bool sent, ) = payable(owner).call{value: amount}("");
        require(sent, "TreasuryVault: BNB transfer failed");
        emit Withdraw(address(0), owner, amount);
    }

    function withdrawToken(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "TreasuryVault: invalid token");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(amount <= balance, "TreasuryVault: insufficient token balance");

        bool success = IERC20(token).transfer(owner, amount);
        require(success, "TreasuryVault: token transfer failed");
        emit Withdraw(token, owner, amount);
    }

    function setLimits(uint256 _maxTx, uint256 _dailyLimit) external onlyOwner {
        maxTransactionAmount = _maxTx;
        dailySpendingLimit = _dailyLimit;
        emit LimitsUpdated(_maxTx, _dailyLimit);
    }

    function setAuthorizedAgent(address agent, bool authorized) external onlyOwner {
        require(agent != address(0), "TreasuryVault: invalid agent");
        authorizedAgents[agent] = authorized;
        emit AgentAuthorized(agent, authorized);
    }

    function setApprovedRecipient(address recipient, bool approved) external onlyOwner {
        require(recipient != address(0), "TreasuryVault: invalid recipient");
        approvedRecipients[recipient] = approved;
        emit RecipientApproved(recipient, approved);
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedTokens[token] = allowed;
        emit TokenAllowed(token, allowed);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "TreasuryVault: invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // ==================== AI Agent Operations ====================

    function executeAgentTransfer(
        address token,
        address payable recipient,
        uint256 amount
    ) external onlyAuthorizedAgent whenNotPaused {
        require(allowedTokens[token], "TreasuryVault: token not allowed");
        require(approvedRecipients[recipient], "TreasuryVault: recipient not approved");
        require(amount <= maxTransactionAmount, "TreasuryVault: amount exceeds tx limit");

        // Refresh 24h spending window
        if (block.timestamp >= lastSpendingReset + 1 days) {
            spentToday = 0;
            lastSpendingReset = block.timestamp;
        }

        require(spentToday + amount <= dailySpendingLimit, "TreasuryVault: exceeds daily limit");
        spentToday += amount;

        if (token == address(0)) {
            require(address(this).balance >= amount, "TreasuryVault: insufficient BNB balance");
            (bool sent, ) = recipient.call{value: amount}("");
            require(sent, "TreasuryVault: BNB transfer failed");
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance >= amount, "TreasuryVault: insufficient token balance");
            bool sent = IERC20(token).transfer(recipient, amount);
            require(sent, "TreasuryVault: token transfer failed");
        }

        emit AgentTransferExecuted(token, recipient, amount, msg.sender);
    }

    // ==================== View Functions ====================

    function getBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }

    function getSpendingStatus()
        external
        view
        returns (
            uint256 maxTx,
            uint256 dailyLimit,
            uint256 currentSpentToday,
            uint256 remainingToday
        )
    {
        uint256 effectiveSpent = spentToday;
        if (block.timestamp >= lastSpendingReset + 1 days) {
            effectiveSpent = 0;
        }
        uint256 remaining = dailySpendingLimit > effectiveSpent
            ? dailySpendingLimit - effectiveSpent
            : 0;
        return (maxTransactionAmount, dailySpendingLimit, effectiveSpent, remaining);
    }
}

