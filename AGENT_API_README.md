# Agent API（远程触发）

已按“远程触发模式”接好两条接口：
- `POST /api/agent/plan`
- `POST /api/agent/execute`

> 作用：让其他 agent 或外部脚本可直接提交参数，自动计算建议 tile 并（可选）在服务端代签发交易。

## 1) 获取计划（Plan）

```bash
curl -X POST https://takeover-bsc.vercel.app/api/agent/plan \
  -H 'Content-Type: application/json' \
  -d '{
    "coin":"0x0000000000000000000000000000000000000000",
    "budgetBnb":"0.5",
    "maxPriceBnb":"0.05",
    "strategy":"cheapest"
  }'
```

响应示例：
```json
{
  "ok": true,
  "suggestion": {
    "ok": true,
    "mode": "agent",
    "strategy": "cheapest",
    "tileId": 42,
    "priceBnb": "0.01",
    "reason": "Cheapest eligible tile among ...",
    "candidatesCount": 8,
    "boardSize": 100
  },
  "plan": { ... }
}
```

## 2) 执行（Execute）

```bash
curl -X POST https://takeover-bsc.vercel.app/api/agent/execute \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <AGENT_API_TOKEN>' \
  -d '{
    "coin":"0x0000000000000000000000000000000000000000",
    "budgetBnb":"0.5",
    "maxPriceBnb":"0.05",
    "strategy":"cheapest"
  }'
```

返回有 `txHash`（真实上链）或 `dryRun: true`。

如果服务端设置了 `AGENT_API_TOKEN`，接口会校验 `Authorization: Bearer ...` 或 `x-agent-token`。

## 环境变量（部署端）

- `AGENT_API_TOKEN`：可选，接口鉴权。
- `AGENT_PRIVATE_KEY`：执行端签名私钥（若要代签发交易必须设置）。
- `BSC_TESTNET_RPC` 或 `NEXT_PUBLIC_BSC_TESTNET_RPC`：RPC 节点。

## 说明

当前页面的 Agent 模式仍保留“本地推荐”；
`/api/agent/*` 提供的是远程触发入口，可直接被其他 agent 服务调用。