---
sidebar_position: 4
---

# Accounts

```
         Synopsis

         This document describes the in-built account and public key system of the Cosmos
         SDK.
```

## Account Definition

In the Cosmos SDK, an account designates a pair of public key `PubKey` and private key `PrivKey`. The `PubKey` can be derived to generate various `Addresses`, which are used to identify users (among other parties) in the application. `Addresses` are also associated with `message`s to identify the sender of the `message`. The `PrivKey` is used to generate digital signatures to prove that an `Address` associated with the `PrivKey` approved of a given `message`.

For HD key derivation the Cosmos SDK uses a standard called BIP32 . The BIP32 allows users to create an HD wallet (as specified in BIP44 ) - a set of accounts derived from an initial secret seed. A seed is usually created from a 12- or 24-word mnemonic. A single seed can derive any number of `PrivKey`s using a one-way cryptographic function. Then, a `PubKey` can be derived from the `PrivKey`. Naturally, the mnemonic is the most sensitive information, as private keys can always be re-generated if the mnemonic is preserved.

```
     Account 0                         Account 1                         Account 2

+------------------+              +------------------+               +------------------+
|                  |              |                  |               |                  |
|    Address 0     |              |    Address 1     |               |    Address 2     |
|        ^         |              |        ^         |               |        ^         |
|        |         |              |        |         |               |        |         |
|        |         |              |        |         |               |        |         |
|        |         |              |        |         |               |        |         |
|        +         |              |        +         |               |        +         |
|  Public key 0    |              |  Public key 1    |               |  Public key 2    |
|        ^         |              |        ^         |               |        ^         |
|        |         |              |        |         |               |        |         |
|        |         |              |        |         |               |        |         |
|        |         |              |        |         |               |        |         |
|        +         |              |        +         |               |        +         |
|  Private key 0   |              |  Private key 1   |               |  Private key 2   |
|        ^         |              |        ^         |               |        ^         |
+------------------+              +------------------+               +------------------+
         |                                 |                                  |
         |                                 |                                  |
         |                                 |                                  |
         +--------------------------------------------------------------------+
                                           |
                                           |
                                 +---------+---------+
                                 |                   |
                                 |  Master PrivKey   |
                                 |                   |
                                 +-------------------+
                                           |
                                           |
                                 +---------+---------+
                                 |                   |
                                 |  Mnemonic (Seed)  |
                                 |                   |
                                 +-------------------+

```

In the Cosmos SDK, keys are stored and managed by using an object called a `Keyring`.

## Keys, accounts, addresses, and signatures

The principal way of authenticating a user is done using digital signatures . Users sign transactions using their own private key. Signature verification is done with the associated public key. For on-chain signature verification purposes, we store the public key in an `Account` object (alongside other data required for a proper transaction validation).

In the node, all data is stored using Protocol Buffers serialization.

The Cosmos SDK supports the following digital key schemes for creating digital signatures:

-   `secp256k1`, as implemented in the SDK's`crypto/keys/secp256k1`package .

-   `secp256r1`, as implemented in the SDK's `crypto/keys/secp256r1` package ,

-   `tm-ed25519`, as implemented in the SDK `crypto/keys/ed25519` package . This scheme is supported only for the consensus validation.

| | Address length | Public key length | Used for transaction | Used for consensus | | | in bytes | in bytes | authentication |(tendermint) | |--------------+----------------+-------------------+----------------------+--------------------| | secp256k1 | 20| 33 | yes | no | | secp256r1 | 32 | 33 | yes | no | | tm-ed25519 | -- not used -- | 32 | no | yes |

## Addresses

`Addresses` and `PubKeys` are both public information that identifies actors in the application. `Account` is used to store authentication information. The basic account implementation is provided by a `BaseAccount` object.

Each account is identified using Address which is a sequence of bytes derived from a public key. In SDK, we define 3 types of addresses that specify a context where an account is used:

-   `AccAddress` identifies users (the sender of a `message`).

-   `ValAddress` identifies validator operators.

-   `ConsAddress` identifies validator nodes that are participating in consensus. Validator nodes are derived using the **`ed25519`** curve.

These types implement the Address interface:

```
// Address is a common interface for different types of addresses used by the SDK
type Address interface {
	Equals(Address) bool
	Empty() bool
	Marshal() ([]byte, error)
	MarshalJSON() ([]byte, error)
	Bytes() []byte
	String() string
	Format(s fmt.State, verb rune)
}

// Ensure that different address types implement the interface
var _ Address = AccAddress{}
var _ Address = ValAddress{}
var _ Address = ConsAddress{}

var _ yaml.Marshaler = AccAddress{}
var _ yaml.Marshaler = ValAddress{}
var _ yaml.Marshaler = ConsAddress{}

```

Address construction algorithm is defined in ADR-28 . Here is the standard way to obtain an account address from a `pub` public key:

```
sdk.AccAddress(pub.Address().Bytes())

```

Of note, the `Marshal()` and `Bytes()` method both return the same raw `[]byte` form of the address. `Marshal()` is required for Protobuf compatibility.

For user interaction, addresses are formatted using Bech32 (opens new window)and implemented by the `String` method. The Bech32 method is the only supported format to use when interacting with a blockchain. The Bech32 human-readable part (Bech32 prefix) is used to denote an address type. Example:

```
Of note, the Marshal() and Bytes() method both return the same raw []byte form of the address. Marshal() is required for Protobuf compatibility.

For user interaction, addresses are formatted using Bech32 (opens new window)and implemented by the String method. The Bech32 method is the only supported format to use when interacting with a blockchain. The Bech32 human-readable part (Bech32 prefix) is used to denote an address type. Example:
```
