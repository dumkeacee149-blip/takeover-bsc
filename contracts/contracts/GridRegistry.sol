// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFeeVault {
    function depositFromProtocol(address coin) external payable;
}

/// @notice MVP GridRegistry for a 10x10 tile grid per coin.
/// - Takeover payment is split:
///   - 90% credited to previous owner (withdraw pattern)
///   - 10% sent to FeeVault to be redistributed as rewards
/// - Price increases by 1.1x per takeover.
///
/// NOTE: For deployment simplicity we allow setting feeVault once post-deploy.
contract GridRegistry {
    uint256 public constant GRID_SIZE = 10;
    uint256 public constant TILE_COUNT = GRID_SIZE * GRID_SIZE; // 100

    uint256 public constant BPS = 10_000;
    uint256 public constant COMP_BPS = 9_000; // 90%
    uint256 public constant FEE_BPS  = 1_000; // 10%
    uint256 public constant PRICE_MULT_BPS = 11_000; // 1.1x

    struct Tile {
        address owner;
        uint256 priceWei;
    }

    address public owner;
    address public feeVault;

    mapping(address => bool) public coinInited; // coin => inited
    mapping(address => mapping(uint256 => Tile)) public tiles; // coin => tileId => Tile
    mapping(address => uint256) public pendingWithdrawals; // user => wei

    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event FeeVaultSet(address indexed feeVault);
    event CoinInitialized(address indexed coin, uint256 initialPriceWei);
    event Takeover(
        address indexed coin,
        uint256 indexed tileId,
        address indexed oldOwner,
        address newOwner,
        uint256 paidWei,
        uint256 compensationWei,
        uint256 protocolFeeWei,
        uint256 newPriceWei
    );
    event Withdraw(address indexed user, uint256 amountWei);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero addr");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setFeeVault(address _feeVault) external onlyOwner {
        require(feeVault == address(0), "feeVault already set");
        require(_feeVault != address(0), "zero addr");
        feeVault = _feeVault;
        emit FeeVaultSet(_feeVault);
    }

    function initCoin(address coin, uint256 initialPriceWei) external onlyOwner {
        require(feeVault != address(0), "feeVault not set");
        require(!coinInited[coin], "coin already inited");
        require(initialPriceWei > 0, "bad initial price");

        coinInited[coin] = true;
        for (uint256 i = 0; i < TILE_COUNT; i++) {
            tiles[coin][i] = Tile({ owner: address(0), priceWei: initialPriceWei });
        }
        emit CoinInitialized(coin, initialPriceWei);
    }

    function getTile(address coin, uint256 tileId) external view returns (address tileOwner, uint256 priceWei) {
        require(tileId < TILE_COUNT, "bad tile");
        Tile memory t = tiles[coin][tileId];
        return (t.owner, t.priceWei);
    }

    function takeover(address coin, uint256 tileId) external payable {
        require(coinInited[coin], "coin not inited");
        require(tileId < TILE_COUNT, "bad tile");
        require(feeVault != address(0), "feeVault not set");

        Tile storage t = tiles[coin][tileId];
        require(msg.value >= t.priceWei, "insufficient payment");

        address oldOwner = t.owner;
        uint256 paid = msg.value;

        uint256 protocolFee = (paid * FEE_BPS) / BPS;
        uint256 compensation = paid - protocolFee;

        // Credit previous owner (withdraw pattern)
        if (oldOwner != address(0) && compensation > 0) {
            pendingWithdrawals[oldOwner] += compensation;
        } else {
            // No old owner: route all to protocol fee
            protocolFee += compensation;
            compensation = 0;
        }

        // Route protocol fee into FeeVault as rewards for this coin
        if (protocolFee > 0) {
            IFeeVault(feeVault).depositFromProtocol{value: protocolFee}(coin);
        }

        // Set new owner and raise price
        t.owner = msg.sender;
        t.priceWei = (t.priceWei * PRICE_MULT_BPS) / BPS;

        emit Takeover(coin, tileId, oldOwner, msg.sender, paid, compensation, protocolFee, t.priceWei);
    }

    function withdraw() external {
        uint256 amt = pendingWithdrawals[msg.sender];
        require(amt > 0, "nothing");
        pendingWithdrawals[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amt}("");
        require(ok, "withdraw failed");
        emit Withdraw(msg.sender, amt);
    }

    receive() external payable {}
}
