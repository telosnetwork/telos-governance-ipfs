# telos-governance-ipfs

### How to add more tables

First identify the logic, you may need to query multiple tables to find scope and then use that scope to iterate another sub-table

To add the `Struct` for a table from a given ABI, install [abi2core](https://github.com/greymass/abi2core) and run against the contract address you want the `Struct` for:

```bash
curl -u https://mainnet.telos.net get abi amend.decide | abi2core
```

And then copy the `Struct` definition to where you need it