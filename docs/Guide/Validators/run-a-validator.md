---
sidebar_position: 1
---

# Setup A Validator

:::info
Remember that validator functionality falls under staking channel of aphelion where the initial support covers the Dpos+Pbft chains. For this purpose, libonomy development team has added the support for tendermint and other POS variant chains. In order to interact with AI and POW channels this section shouldn't be used.
:::

Kindly run your mainnet node before creating the validator [Run Mainnet Node](../Installation/join-staking-network.md) guide.

## What is a Validator?

[Validators](./description.md) in POS variant chains are responsible for commiting/verifying blocks and verify the transactions. In order to become a validator, first the stake needs to be put by which they are able to join the network. Their stakes get slashed if they are unavailble or double sign the block.

:::info
On aphelion there are few other rules and regulations for the validators which we will cover in the regulation section
:::

## Manual Setup

### Create Your Validator

You need to have validator public key in order to create a validator which you get when you setup a mainnet node.
In order to view your public key you can run

```bash
cuspd aphelion show-validator
```

You can carry out following steps in order to create a validator

:::info
LBY denomination is flby where 1 LBY = 1 \* 10^6 flby
:::

```bash
cuspcli tx staking create-validator
    --amount=200000000flby
    --pubkey=$(cuspd aphelion show-validator)
    --moniker="Your Validator Name "
    --chain-id= main-stake
    --from= YOUR_KEY_NAME_ON_CLI
    --commission-rate="0.25"
    --commission-max-rate="0.45"
    --commission-max-change-rate="0.025"
    --min-self-delegation="1"
```

:::tip

`moniker` is human readable name for your validator by which it can be located on libonomy staking network.

`commission-rate` is used to specfy the commision you will charge on the network.

`commission-max-change-rate` is used to measure % change over the `commission-rate`.

`Min-self-delegation` is a non-negative integer used to specify the minimum amount of self-delegated voting power for your validator.
:::

In order to verify whether creation of your validator, you can view explorer or use CLI to get the information regarding your validator

### Confirm Your Validator is Running

Your validator is active if the following command returns anything:

```bash
cuspcli query aphelion-validator-set | grep "$(cuspd aphelion show-address)"
```
:::warning Note
In order to appear in validator set you need to posses the minimum voting power proposed in the network. On aphelion staking network the rules and conditions are different.
:::


## Edit Validator Description

Node operators can also edit the information of their validator. This information can help public to chose their validator on the network and stake their coins to them. When editing the information regarding the validator, input on each flag should be properly provided.

```bash
cuspcli tx staking edit-validator
  --moniker="Your Validator HR Name " 
  --website="https://libonomy.dev" 
  --identity=YOUR_KEYBASE_AVATAR 
  --details="Robots in disguise" 
  --chain-id=main-stake 
  --gas="auto" 
  --gas-prices="0.001flby" 
  --from=YOUR_KEY_NAME_ON_CLI 
  --commission-rate="0.25"
```

**Note**: The `commission-rate` value must adhere to the following invariants:

- Must be between 0 and the validator's `commission-max-rate`
- Must not exceed the validator's `commission-max-change-rate` which is maximum
  % point change rate **per day**. In other words, a validator can only change
  its commission once per day and within `commission-max-change-rate` bounds.

## View Validator Description

You can also view your validator's information by running:

```bash
cuspcli query staking validator YOUR_BECH32_VALOPER_ADDRESS
```

## Unjail Validator

When validator is **_jailed_** for violating the rules of the network, it should submit the unjail transaction from the operator accoutn in order earn rewards again

```bash
cuspcli tx slashing unjail 
	--from=YOUR_KEY_NAME_ON_CLI  
	--chain-id=main-stake
```

