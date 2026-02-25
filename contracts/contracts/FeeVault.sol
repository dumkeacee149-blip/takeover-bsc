// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGridRegistry {
    function coinInited(address coin) external view returns (bool);
    function TILE_COUNT() external view returns (uint256);
    function tiles(address coin, uint256 tileId) external view returns (address owner, uint256 priceWei);
}

/// @notice FeeVault collects protocol fees (BNB) and lets tile owners claim per-tile rewards.
/// Rewards are distributed equally per tile: deposit / TILE_COUNT.
contract FeeVault {
    uint256 public constant ACC = 1e18;

    IGridRegistry public immutable grid;

    // coin => accumulator (scaled by ACC)
    mapping(address => uint256) public accRewardPerTile;
    // coin => tileId => debt
    mapping(address => mapping(uint256 => uint256)) public tileRewardDebt;

    event RewardsDeposited(address indexed coin, uint256 amountWei);
    event Claimed(address indexed coin, uint256 indexed tileId, address indexed owner, uint256 amountWei);

    constructor(address gridRegistry) {
        grid = IGridRegistry(gridRegistry);
    }

    function depositFromProtocol(address coin) external payable {
        require(grid.coinInited(coin), "coin not inited");
        uint256 n = grid.TILE_COUNT();
        require(n > 0, "bad n");
        if (msg.value == 0) return;

        accRewardPerTile[coin] += (msg.value * ACC) / n;
        emit RewardsDeposited(coin, msg.value);
    }

    function pending(address coin, uint256 tileId) public view returns (uint256) {
        (address owner, ) = grid.tiles(coin, tileId);
        if (owner == address(0)) return 0;
        uint256 acc = accRewardPerTile[coin];
        uint256 debt = tileRewardDebt[coin][tileId];
        if (acc <= debt) return 0;
        return (acc - debt) / ACC;
    }

    function claim(address coin, uint256 tileId) external {
        (address owner, ) = grid.tiles(coin, tileId);
        require(owner == msg.sender, "not owner");

        uint256 acc = accRewardPerTile[coin];
        uint256 debt = tileRewardDebt[coin][tileId];
        require(acc > debt, "nothing");

        uint256 amt = (acc - debt) / ACC;
        tileRewardDebt[coin][tileId] = acc;

        (bool ok, ) = msg.sender.call{value: amt}("");
        require(ok, "pay failed");
        emit Claimed(coin, tileId, msg.sender, amt);
    }

    receive() external payable {}
}
