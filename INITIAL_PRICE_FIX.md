# Fix 0.01 BNB initial price (current deploy state)

你现在看到 `0.01 BNB` 是正常现象之一，通常有两种原因：

1) 合约里这个 `coin` 已经初始化过（`coinInited[coin] == true`）
2) 该币种第一次 init 时传入的就是 `0.01`

### 关键限制（当前合约）
- `initCoin` 有 `require(!coinInited[coin])`
- 因此**已经初始化的币不能直接改初始价**

### 你可以这样真正修复
1) 使用一个**未初始化的新 coin 地址**（or 空地址）重新 init：
```bash
cd /Users/dalao/.openclaw/workspace/takeover-bsc/contracts
export GRID_REGISTRY=0xCD7D59a2560Fd5B15ca2803b9b1F4b2d2e049F7B
export INITIAL_PRICE_BNB=0.1
export COIN=0x0000000000000000000000000000000000000000   # 或一个新 coin
npx hardhat run scripts/initCoin.js --network bsctest
```

2) 如果你就是这个 coin 且已经 inited 为 0.01：
- 无法就地改价（协议层不允许）
- 需要**重新部署新 GridRegistry**，再 init 新 coin，最后让前端切到新地址

### 推荐最少停机修法
- 新部署一份合约（含 `GridRegistry + FeeVault`）
- 用 `0.1` init 新 coin
- 更新 `web/deployments/bsctest.json` 的地址
- 部署前端/重启页面

我可以下一步直接给你一条“单次执行命令序列”（含部署、init、写入 deployment 文件、启动前端）
