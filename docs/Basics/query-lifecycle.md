---
sidebar_position: 3
---

# Query Lifecycle

```
         Synopsis

         This document describes the lifecycle of a query in a SDK application, from the user
         interface to application stores and back.
```

## Query Creation

A query is a request for information made by end-users of applications through an interface and processed by a full-node. Users can query information about the network, the application itself, and application state directly from the application's stores or modules. Note that queries are different from transactions (view the lifecycle here), particularly in that they do not require consensus to be processed (as they do not trigger state-transitions); they can be fully handled by one full-node.

For the purpose of explaining the query lifecycle, let's say `MyQuery` is requesting a list of delegations made by a certain delegator address in the application called `simapp`. As to be expected, the `staking` module handles this query. But first, there are a few ways MyQuery can be created by users.

### CLI

The main interface for an application is the command-line interface. Users connect to a full-node and run the CLI directly from their machines - the CLI interacts directly with the full-node. To create MyQuery from their terminal, users type the following command:

```
simd query staking delegations <delegatorAddress>
```

This query command was defined by the `staking` module developer and added to the list of subcommands by the application developer when creating the CLI.

Note that the general format is as follows:

```
simd query [moduleName] [command] <arguments> --flag <flagArg>

```

To provide values such as `--node` (the full-node the CLI connects to), the user can use the `app.toml` config file to set them or provide them as flags.

The CLI understands a specific set of commands, defined in a hierarchical structure by the application developer: from the root command (`simd`), the type of command (`Myquery`), the module that contains the command (`staking`), and command itself (`delegations`). Thus, the CLI knows exactly which module handles this command and directly passes the call there.

### gRPC

-   A patch introduced in `go-grpc v1.34.0` made gRPC incompatible with the gogoproto library, making some gRPC queries panic. As such, the SDK requires that `go-grpc <=v1.33.2` is installed in your `go.mod`.

-   To make sure that gRPC is working properly, it is highly recommended to add the following line in your application's go.mod:

```
replace google.golang.org/grpc => google.golang.org/grpc v1.33.2

```

-   Please see issue #8392 for more info.

Another interface through which users can make queries, introduced in Libonomy SDK v0.40, is gRPC requests to a gRPC server. The endpoints are defined as Protocol Buffers service methods inside `.proto` files, written in Protobuf's own language-agnostic interface definition language (IDL). The Protobuf ecosystem developed tools for code-generation from` \*.proto` files into various languages. These tools allow to build gRPC clients easily.

One such tool is grpcurl , and a gRPC request for `MyQuery` using this client looks like:

```
grpcurl \
    -plaintext                                           # We want results in plain test
    -import-path ./proto \                               # Import these .proto files
    -proto ./proto/  Libonomy/staking/v1beta1/query.proto \  # Look into this .proto file for the Query protobuf service
    -d '{"address":"$MY_DELEGATOR"}' \                   # Query arguments
    localhost:9090 \                                     # gRPC server endpoint
      Libonomy.staking.v1beta1.Query/Delegations             # Fully-qualified service method name

```

### REST

Another interface through which users can make queries is through HTTP Requests to a REST server. The REST server is fully auto-generated from Protobuf services, using gRPC-gateway .

An example HTTP request for `MyQuery` looks like:

```
GET http://localhost:1317/  Libonomy/staking/v1beta1/delegators/{delegatorAddr}/delegations
```

## How Queries are Handled by the CLI

The examples above show how an external user can interact with a node by querying its state. To understand more in details the exact lifecycle of a query, let's dig into how the CLI prepares the query, and how the node handles it. The interactions from the users' perspective are a bit different, but the underlying functions are almost identical because they are implementations of the same command defined by the module developer. This step of processing happens within the CLI, gRPC or REST server and heavily involves a `client.Context`.

### Context

The first thing that is created in the execution of a CLI command is a `client.Context`. A `client.Context` is an object that stores all the data needed to process a request on the user side. In particular, a `client.Context` stores the following:

-   **Codec**: The encoder/decoder used by the application, used to marshal the parameters and query before making the Tendermint RPC request and unmarshal the returned response into a JSON object. The default codec used by the CLI is Protobuf.

-   **Account Decoder:** The account decoder from the `auth` module, which translates []bytes into accounts.

-   **RPC Client:** The Tendermint RPC Client, or node, to which the request will be relayed to.

-   **Keyring:** A Key Manager used to sign transactions and handle other operations with keys.

-   **Output Writer:** A Writer used to output the response.

-   **Configurations:** The flags configured by the user for this command, including --height, specifying the height of the blockchain to query and --indent, which indicates to add an indent to the JSON response.

The client.Context also contains various functions such as Query() which retrieves the RPC Client and makes an ABCI call to relay a query to a full-node.

```
// Context implements a typical context created in SDK modules for transaction
// handling and queries.
type Context struct {
	FromAddress       sdk.AccAddress
	Client            rpcclient.Client
	ChainID           string
	JSONMarshaler     codec.JSONMarshaler
	InterfaceRegistry codectypes.InterfaceRegistry
	Input             io.Reader
	Keyring           keyring.Keyring
	Output            io.Writer
	OutputFormat      string
	Height            int64
	HomeDir           string
	KeyringDir        string
	From              string
	BroadcastMode     string
	FromName          string
	SignModeStr       string
	UseLedger         bool
	Simulate          bool
	GenerateOnly      bool
	Offline           bool
	SkipConfirm       bool
	TxConfig          TxConfig
	AccountRetriever  AccountRetriever
	NodeURI           string

	// TODO: Deprecated (remove).
	LegacyAmino *codec.LegacyAmino
}
```

The `client.Context`'s primary role is to store data used during interactions with the end-user and provide methods to interact with this data - it is used before and after the query is processed by the full-node. Specifically, in handling MyQuery, the `client.Context` is utilized to encode the query parameters, retrieve the full-node, and write the output. Prior to being relayed to a full-node, the query needs to be encoded into a `[]byte` form, as full-nodes are application-agnostic and do not understand specific types. The full-node (RPC Client) itself is retrieved using the `client.Context`, which knows which node the user CLI is connected to. The query is relayed to this full-node to be processed. Finally, the `client.Context` contains a `Writer` to write output when the response is returned. These steps are further described in later sections.

## Arguments and Route Creation

At this point in the lifecycle, the user has created a CLI command with all of the data they wish to include in their query. A `client.Context` exists to assist in the rest of the `MyQuery`'s journey. Now, the next step is to parse the command or request, extract the arguments, and encode everything. These steps all happen on the user side within the interface they are interacting with.

### Encoding

In our case (querying an address's delegations), `MyQuery` contains an address `delegatorAddress` as its only argument. However, the request can only contain `[]bytes`, as it will be relayed to a consensus engine (e.g. Tendermint Core) of a full-node that has no inherent knowledge of the application types. Thus, the `codec` of `client.Context` is used to marshal the address.

Here is what the code looks like for the CLI command:

```
	delAddr, err := sdk.AccAddressFromBech32(args[0])
			if err != nil {
				return err
			}
```

### gRPC Query Client Creation

The SDK leverages code generated from Protobuf services to make queries. The `staking` module's `MyQuery` service generates a `queryClient`, which the CLI will use to make queries. Here is the relevant code:

```
			clientCtx, err := client.GetClientQueryContext(cmd)
			if err != nil {
				return err
			}
			queryClient := types.NewQueryClient(clientCtx)

			delAddr, err := sdk.AccAddressFromBech32(args[0])
			if err != nil {
				return err
			}

			pageReq, err := client.ReadPageRequest(cmd.Flags())
			if err != nil {
				return err
			}

			params := &types.QueryDelegatorDelegationsRequest{
				DelegatorAddr: delAddr.String(),
				Pagination:    pageReq,
			}

			res, err := queryClient.DelegatorDelegations(context.Background(), params)
			if err != nil {
				return err
			}
```

Under the hood, the `client.Context` has a `Query()` function used to retrieve the pre-configured node and relay a query to it; the function takes the query fully-qualified service method name as path (in our case: `/ Libonomy.staking.v1beta1.Query/Delegations`), and arguments as parameters. It first retrieves the RPC Client (called the node) configured by the user to relay this query to, and creates the `ABCIQueryOptions` (parameters formatted for the ABCI call). The node is then used to make the ABCI call, `ABCIQueryWithOptions()`.

Here is what the code looks like:

```
func (ctx Context) queryABCI(req abci.RequestQuery) (abci.ResponseQuery, error) {
	node, err := ctx.GetNode()
	if err != nil {
		return abci.ResponseQuery{}, err
	}

	opts := rpcclient.ABCIQueryOptions{
		Height: ctx.Height,
		Prove:  req.Prove,
	}

	result, err := node.ABCIQueryWithOptions(context.Background(), req.Path, req.Data, opts)
	if err != nil {
		return abci.ResponseQuery{}, err
	}

	if !result.Response.IsOK() {
		return abci.ResponseQuery{}, errors.New(result.Response.Log)
	}

	// data from trusted node or subspace query doesn't need verification
	if !opts.Prove || !isQueryStoreWithProof(req.Path) {
		return result.Response, nil
	}

	return result.Response, nil
}
```

## RPC

With a call to `ABCIQueryWithOptions()`, `MyQuery` is received by a full-node which will then process the request. Note that, while the RPC is made to the consensus engine (e.g. Tendermint Core) of a full-node, queries are not part of consensus and will not be broadcasted to the rest of the network, as they do not require anything the network needs to agree upon.

Read more about ABCI Clients and Tendermint RPC in the Tendermint documentation here .

## Application Query Handling

When a query is received by the full-node after it has been relayed from the underlying consensus engine, it is now being handled within an environment that understands application-specific types and has a copy of the state. `baseapp` implements the ABCI `Query() `function and handles gRPC queries. The query route is parsed, and it it matches the fully-qualified service method name of an existing service method (most likely in one of the modules), then baseapp will relay the request to the relevant module.

Apart from gRPC routes, `baseapp` also handles four different types of queries: `app`, `store`, `p2p`, and `custom`. The first three types (`app`, `store`, `p2p`) are purely application-level and thus directly handled by `baseapp` or the stores, but the `custom` query type requires baseapp to route the query to a module's legacy queriers. To learn more about these queries, please refer to this guide.

Since `MyQuery` has a Protobuf fully-qualified service method name from the `staking` module (recall `/ Libonomy.staking.v1beta1.Query/Delegations`), `baseapp` first parses the path, then uses its own internal GRPCQueryRouter to retrieve the corresponding gRPC handler, and routes the query to the module. The gRPC handler is responsible for recognizing this query, retrieving the appropriate values from the application's stores, and returning a response. Read more about query services here.

Once a result is received from the querier, baseapp begins the process of returning a response to the user.

## Response

Since `Query()` is an ABCI function, `baseapp` returns the response as an `abci.ResponseQuery` type. The `client.Context` `Query()` routine receives the response and.

### CLI Response

The application `codec` is used to unmarshal the response to a JSON and the client.Context prints the output to the command line, applying any configurations such as the output type (text, JSON or YAML).

```
func (ctx Context) printOutput(out []byte) error {
	if ctx.OutputFormat == "text" {
		// handle text format by decoding and re-encoding JSON as YAML
		var j interface{}

		err := json.Unmarshal(out, &j)
		if err != nil {
			return err
		}

		out, err = yaml.Marshal(j)
		if err != nil {
			return err
		}
	}

	writer := ctx.Output
	if writer == nil {
		writer = os.Stdout
	}

	_, err := writer.Write(out)
	if err != nil {
		return err
	}

	if ctx.OutputFormat != "text" {
		// append new-line for formats besides YAML
		_, err = writer.Write([]byte("\n"))
		if err != nil {
			return err
		}
	}

	return nil
}
```

And that's a wrap! The result of the query is outputted to the console by the CLI.
