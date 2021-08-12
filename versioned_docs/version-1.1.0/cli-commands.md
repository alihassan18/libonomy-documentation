---
sidebar_position: 1.2
---

# Cli Commands

#All the addresses begin with libonomy prefix

#For keypair generation
```
cuspcli keys add accountname
```

#the returned seed phrase and private key should be secured properly otherwise they will not
be recoverable

#for keys recovery from backup
```
cuspcli keys add --recover
```

#for checking keys
```
Cuspcli keys show accountname
```

#for all present keys in the node
```
cuspcli keys list
```

#for checkout account balance
```
Cuspcli query account accountname
```

#for sending coins from one account to another
```
cuspcli tx send senderaccountaddress receiveraccountaddress
9999999 libocoin --chain-id=main-stake
```
#if you dont want to broadcast the transaction simply add
the flag 
```
--dry-run
```

### For generation of multi sig keys

```
cuspcli keys add --multisig=key1,key2,key3[...]
--multisig-threshold=K new_key_name
```

#threshhold means the private keys set to sign the
transactions. All the keys which are going to be included
for multisign must also exist in local DB of system

### View Transactions through CLI

#query txs on the basis of events

```
cuspcli query txs
--events='message.sender=libonomy1r6lr2mjgqczkprglwq3a2ve0j
n37udrwh5r9s9'
```

#pagination is supported by adding flags --page=1
--limit=10

#for multiple events just add &mention_your_event_name


### Offline Transactions through CLI

#Using cuspcli you can simulate unsignedTX by following
example

```
cuspcli tx send <sender_address> <destination_address>
10flby --chain-id=<chain_id> --dry-run
```

#pagination is supported by adding flags --page=1
--limit=10

#for multiple events just add &mention_your_event_name

#to generate JSON output without broadcasting using cli

```
cuspcli tx send <sender_address> <recipient_address> 10flby
--chain-id=<chain_id> --generate-only > unsignedTx.json
```

#you can sign json raw tx with your key and output the
signed transaction

```
cuspcli tx sign --chain-id=<chain_id>
--from=<acount_name> unsignedTx.json > signedTx.json
```