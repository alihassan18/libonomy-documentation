---
sidebar_position: 1
---

# Anatomy of an SDK Application

```
         Synopsis

         This document describes the core parts of a   Libonomy SDK application. Throughout
         the document, a placeholder application named app will be used.
```

## Node Client

The Daemon, or Full-Node Client, is the core process of an SDK-based blockchain. Participants in the network run this process to initialize their state-machine, connect with other full-nodes and update their state-machine as new blocks come in.

```
                ^  +-------------------------------+  ^
                |  |                               |  |
                |  |  State-machine = Application  |  |
                |  |                               |  |   Built with   Libonomy SDK
                |  |            ^      +           |  |
                |  +----------- | ABCI | ----------+  v
                |  |            +      v           |  ^
                |  |                               |  |
Blockchain Node |  |           Consensus           |  |
                |  |                               |  |
                |  +-------------------------------+  |   Tendermint Core
                |  |                               |  |
                |  |           Networking          |  |
                |  |                               |  |
                v  +-------------------------------+  v

```

The blockchain full-node presents itself as a binary, generally suffixed by -d for "daemon" (e.g. `appd` for `app` or `gaiad` for `gaia`). This binary is built by running a simple main.go function placed in `./cmd/appd/.` This operation usually happens through the Makefile.

Once the main binary is built, the node can be started by running the `start` command. This command function primarily does three things:

1. Create an instance of the state-machine defined in `app.go`.
2. Initialize the state-machine with the latest known state, extracted from the db stored in the `~/.app/data` folder. At this point, the state-machine is at height `appBlockHeight`.
3. Create and start a new Tendermint instance. Among other things, the node will perform a handshake with its peers. It will get the latest blockHeight from them, and replay blocks to sync to this height if it is greater than the local appBlockHeight. If appBlockHeight is 0, the node is starting from genesis and Tendermint sends an InitChain message via the ABCI to the app, which triggers the `InitChainer`.

## Core Application File

In general, the core of the state-machine is defined in a file called `app.go`. It mainly contains the **type definition of the application** and functions to **create and initialize it.**

### Type Definition of the Application

The first thing defined in app.go is the type of the application. It is generally comprised of the following parts:

-   **A reference to `baseapp`.** The custom application defined in app.go is an extension of baseapp. When a transaction is relayed by Tendermint to the application, app uses baseapp's methods to route them to the appropriate module. baseapp implements most of the core logic for the application, including all the ABCI methods and the routing logic.

-   **A list of store keys.** The store, which contains the entire state, is implemented as a multistore (i.e. a store of stores) in the Libonomy SDK. Each module uses one or multiple stores in the multistore to persist their part of the state. These stores can be accessed with specific keys that are declared in the app type. These keys, along with the keepers, are at the heart of the object-capabilities model of the Libonomy SDK.

-   **A list of module's `keeper`s.** Each module defines an abstraction called keeper, which handles reads and writes for this module's store(s). The keeper's methods of one module can be called from other modules (if authorized), which is why they are declared in the application's type and exported as interfaces to other modules so that the latter can only access the authorized functions.

-   **A reference to an `appCodec`.** The application's appCodec is used to serialize and deserialize data structures in order to store them, as stores can only persist []bytes. The default codec is Protocol Buffers.

-   **A reference to a `legacyAmino` codec.** Some parts of the SDK have not been migrated to use the appCodec above, and are still hardcoded to use Amino. Other parts explicity use Amino for backwards compatibility. For these reasons, the application still holds a reference to the legacy Amino codec. Please note that the Amino codec will be removed from the SDK in the upcoming releases.

-   **A reference to a** module manager and a basic module manager. The module manager is an object that contains a list of the application's module. It facilitates operations related to these modules, like registering their Msg service and gRPC Query service, or setting the order of execution between modules for various functions like InitChainer, BeginBlocker and EndBlocker.

See an example of application type definition from simapp, the SDK's own app used for demo and testing purposes:

```
// SimApp extends an ABCI application, but with most of its parameters exported.
// They are exported for convenience in creating helper functions, as object
// capabilities aren't needed for testing.
type SimApp struct {
	*baseapp.BaseApp
	legacyAmino       *codec.LegacyAmino
	appCodec          codec.Marshaler
	interfaceRegistry types.InterfaceRegistry

	invCheckPeriod uint

	// keys to access the substores
	keys    map[string]*sdk.KVStoreKey
	tkeys   map[string]*sdk.TransientStoreKey
	memKeys map[string]*sdk.MemoryStoreKey

	// keepers
	AccountKeeper    authkeeper.AccountKeeper
	BankKeeper       bankkeeper.Keeper
	CapabilityKeeper *capabilitykeeper.Keeper
	StakingKeeper    stakingkeeper.Keeper
	SlashingKeeper   slashingkeeper.Keeper
	MintKeeper       mintkeeper.Keeper
	DistrKeeper      distrkeeper.Keeper
	GovKeeper        govkeeper.Keeper
	CrisisKeeper     crisiskeeper.Keeper
	UpgradeKeeper    upgradekeeper.Keeper
	ParamsKeeper     paramskeeper.Keeper
	IBCKeeper        *ibckeeper.Keeper // IBC Keeper must be a pointer in the app, so we can SetRouter on it correctly
	EvidenceKeeper   evidencekeeper.Keeper
	TransferKeeper   ibctransferkeeper.Keeper

	// make scoped keepers public for test purposes
	ScopedIBCKeeper      capabilitykeeper.ScopedKeeper
	ScopedTransferKeeper capabilitykeeper.ScopedKeeper
	ScopedIBCMockKeeper  capabilitykeeper.ScopedKeeper

	// the module manager
	mm *module.Manager

	// simulation manager
	sm *module.SimulationManager
}
```

## Constructor Function

This function constructs a new application of the type defined in the section above. It must fulfill the `AppCreator` signature in order to be used in the `start` command of the application's daemon command.

```
	// AppCreator is a function that allows us to lazily initialize an
	// application using various configurations.
	AppCreator func(log.Logger, dbm.DB, io.Writer, AppOptions) Application
```

Here are the main actions performed by this function:

-   Instantiate a new `codec` and initialize the `codec` of each of the application's module using the basic manager

-   Instantiate a new application with a reference to a `baseapp` instance, a codec and all the appropriate store keys.

-   Instantiate all the `keeper`s defined in the application's `type` using the `NewKeeper` function of each of the application's modules. Note that `keepers` must be instantiated in the correct order, as the `NewKeeper` of one module might require a reference to another module's `keeper`.

-   Instantiate the application's module manager with the `AppModule` object of each of the application's modules.

-   With the module manager, initialize the application's `Msg` services, gRPC `Query` services, legacy `Msg` routes and legacy query routes. When a transaction is relayed to the application by Tendermint via the ABCI, it is routed to the appropriate module's `Msg` service using the routes defined here. Likewise, when a gRPC query request is received by the application, it is routed to the appropriate module's `gRPC query service` using the gRPC routes defined here. The SDK still supports legacy Msgs and legacy Tendermint queries, which are routed using respectively the legacy Msg routes and the legacy query routes.

-   With the module manager, register the application's modules' invariants. Invariants are variables (e.g. total supply of a token) that are evaluated at the end of each block. The process of checking invariants is done via a special module called the `InvariantsRegistry`. The value of the invariant should be equal to a predicted value defined in the module. Should the value be different than the predicted one, special logic defined in the invariant registry will be triggered (usually the chain is halted). This is useful to make sure no critical bug goes unnoticed and produces long-lasting effects that would be hard to fix.

-   With the module manager, set the order of execution between the `InitGenesis`, `BeginBlocker` and `EndBlocker` functions of each of the application's modules. Note that not all modules implement these functions.

-   Set the remainer of application's parameters:

    -   `InitChainer`: used to initialize the application when it is first started.

    *   `BeginBlocker`, `EndBlocker`: called at the beginning and the end of every block).

    -   `anteHandler`: used to handle fees and signature verification.

-   Mount the stores.
-   Return the application.

Note that this function only creates an instance of the app, while the actual state is either carried over from the `~/.app/data` folder if the node is restarted, or generated from the genesis file if the node is started for the first time.

See an example of application constructor from `simapp`:

```
// NewSimApp returns a reference to an initialized SimApp.
func NewSimApp(
	logger log.Logger, db dbm.DB, traceStore io.Writer, loadLatest bool, skipUpgradeHeights map[int64]bool,
	homePath string, invCheckPeriod uint, encodingConfig simappparams.EncodingConfig,
	appOpts servertypes.AppOptions, baseAppOptions ...func(*baseapp.BaseApp),
) *SimApp {

	// TODO: Remove cdc in favor of appCodec once all modules are migrated.
	appCodec := encodingConfig.Marshaler
	legacyAmino := encodingConfig.Amino
	interfaceRegistry := encodingConfig.InterfaceRegistry

	bApp := baseapp.NewBaseApp(appName, logger, db, encodingConfig.TxConfig.TxDecoder(), baseAppOptions...)
	bApp.SetCommitMultiStoreTracer(traceStore)
	bApp.SetAppVersion(version.Version)
	bApp.SetInterfaceRegistry(interfaceRegistry)

	keys := sdk.NewKVStoreKeys(
		authtypes.StoreKey, banktypes.StoreKey, stakingtypes.StoreKey,
		minttypes.StoreKey, distrtypes.StoreKey, slashingtypes.StoreKey,
		govtypes.StoreKey, paramstypes.StoreKey, ibchost.StoreKey, upgradetypes.StoreKey,
		evidencetypes.StoreKey, ibctransfertypes.StoreKey, capabilitytypes.StoreKey,
	)
	tkeys := sdk.NewTransientStoreKeys(paramstypes.TStoreKey)
	memKeys := sdk.NewMemoryStoreKeys(capabilitytypes.MemStoreKey)

	app := &SimApp{
		BaseApp:           bApp,
		legacyAmino:       legacyAmino,
		appCodec:          appCodec,
		interfaceRegistry: interfaceRegistry,
		invCheckPeriod:    invCheckPeriod,
		keys:              keys,
		tkeys:             tkeys,
		memKeys:           memKeys,
	}

	app.ParamsKeeper = initParamsKeeper(appCodec, legacyAmino, keys[paramstypes.StoreKey], tkeys[paramstypes.TStoreKey])

	// set the BaseApp's parameter store
	bApp.SetParamStore(app.ParamsKeeper.Subspace(baseapp.Paramspace).WithKeyTable(paramskeeper.ConsensusParamsKeyTable()))

	// add capability keeper and ScopeToModule for ibc module
	app.CapabilityKeeper = capabilitykeeper.NewKeeper(appCodec, keys[capabilitytypes.StoreKey], memKeys[capabilitytypes.MemStoreKey])
	scopedIBCKeeper := app.CapabilityKeeper.ScopeToModule(ibchost.ModuleName)
	scopedTransferKeeper := app.CapabilityKeeper.ScopeToModule(ibctransfertypes.ModuleName)
	// NOTE: the IBC mock keeper and application module is used only for testing core IBC. Do
	// note replicate if you do not need to test core IBC or light clients.
	scopedIBCMockKeeper := app.CapabilityKeeper.ScopeToModule(ibcmock.ModuleName)

	// add keepers
	app.AccountKeeper = authkeeper.NewAccountKeeper(
		appCodec, keys[authtypes.StoreKey], app.GetSubspace(authtypes.ModuleName), authtypes.ProtoBaseAccount, maccPerms,
	)
	app.BankKeeper = bankkeeper.NewBaseKeeper(
		appCodec, keys[banktypes.StoreKey], app.AccountKeeper, app.GetSubspace(banktypes.ModuleName), app.BlockedAddrs(),
	)
	stakingKeeper := stakingkeeper.NewKeeper(
		appCodec, keys[stakingtypes.StoreKey], app.AccountKeeper, app.BankKeeper, app.GetSubspace(stakingtypes.ModuleName),
	)
	app.MintKeeper = mintkeeper.NewKeeper(
		appCodec, keys[minttypes.StoreKey], app.GetSubspace(minttypes.ModuleName), &stakingKeeper,
		app.AccountKeeper, app.BankKeeper, authtypes.FeeCollectorName,
	)
	app.DistrKeeper = distrkeeper.NewKeeper(
		appCodec, keys[distrtypes.StoreKey], app.GetSubspace(distrtypes.ModuleName), app.AccountKeeper, app.BankKeeper,
		&stakingKeeper, authtypes.FeeCollectorName, app.ModuleAccountAddrs(),
	)
	app.SlashingKeeper = slashingkeeper.NewKeeper(
		appCodec, keys[slashingtypes.StoreKey], &stakingKeeper, app.GetSubspace(slashingtypes.ModuleName),
	)
	app.CrisisKeeper = crisiskeeper.NewKeeper(
		app.GetSubspace(crisistypes.ModuleName), invCheckPeriod, app.BankKeeper, authtypes.FeeCollectorName,
	)
	app.UpgradeKeeper = upgradekeeper.NewKeeper(skipUpgradeHeights, keys[upgradetypes.StoreKey], appCodec, homePath)

	// register the staking hooks
	// NOTE: stakingKeeper above is passed by reference, so that it will contain these hooks
	app.StakingKeeper = *stakingKeeper.SetHooks(
		stakingtypes.NewMultiStakingHooks(app.DistrKeeper.Hooks(), app.SlashingKeeper.Hooks()),
	)

	// Create IBC Keeper
	app.IBCKeeper = ibckeeper.NewKeeper(
		appCodec, keys[ibchost.StoreKey], app.StakingKeeper, scopedIBCKeeper,
	)

	// register the proposal types
	govRouter := govtypes.NewRouter()
	govRouter.AddRoute(govtypes.RouterKey, govtypes.ProposalHandler).
		AddRoute(paramproposal.RouterKey, params.NewParamChangeProposalHandler(app.ParamsKeeper)).
		AddRoute(distrtypes.RouterKey, distr.NewCommunityPoolSpendProposalHandler(app.DistrKeeper)).
		AddRoute(upgradetypes.RouterKey, upgrade.NewSoftwareUpgradeProposalHandler(app.UpgradeKeeper)).
		AddRoute(ibchost.RouterKey, ibcclient.NewClientUpdateProposalHandler(app.IBCKeeper.ClientKeeper))
	app.GovKeeper = govkeeper.NewKeeper(
		appCodec, keys[govtypes.StoreKey], app.GetSubspace(govtypes.ModuleName), app.AccountKeeper, app.BankKeeper,
		&stakingKeeper, govRouter,
	)

	// Create Transfer Keepers
	app.TransferKeeper = ibctransferkeeper.NewKeeper(
		appCodec, keys[ibctransfertypes.StoreKey], app.GetSubspace(ibctransfertypes.ModuleName),
		app.IBCKeeper.ChannelKeeper, &app.IBCKeeper.PortKeeper,
		app.AccountKeeper, app.BankKeeper, scopedTransferKeeper,
	)
	transferModule := transfer.NewAppModule(app.TransferKeeper)

	// NOTE: the IBC mock keeper and application module is used only for testing core IBC. Do
	// note replicate if you do not need to test core IBC or light clients.
	mockModule := ibcmock.NewAppModule(scopedIBCMockKeeper)

	// Create static IBC router, add transfer route, then set and seal it
	ibcRouter := porttypes.NewRouter()
	ibcRouter.AddRoute(ibctransfertypes.ModuleName, transferModule)
	ibcRouter.AddRoute(ibcmock.ModuleName, mockModule)
	app.IBCKeeper.SetRouter(ibcRouter)

	// create evidence keeper with router
	evidenceKeeper := evidencekeeper.NewKeeper(
		appCodec, keys[evidencetypes.StoreKey], &app.StakingKeeper, app.SlashingKeeper,
	)
	// If evidence needs to be handled for the app, set routes in router here and seal
	app.EvidenceKeeper = *evidenceKeeper

	/****  Module Options ****/

	// NOTE: we may consider parsing `appOpts` inside module constructors. For the moment
	// we prefer to be more strict in what arguments the modules expect.
	var skipGenesisInvariants = cast.ToBool(appOpts.Get(crisis.FlagSkipGenesisInvariants))

	// NOTE: Any module instantiated in the module manager that is later modified
	// must be passed by reference here.
	app.mm = module.NewManager(
		genutil.NewAppModule(
			app.AccountKeeper, app.StakingKeeper, app.BaseApp.DeliverTx,
			encodingConfig.TxConfig,
		),
		auth.NewAppModule(appCodec, app.AccountKeeper, authsims.RandomGenesisAccounts),
		vesting.NewAppModule(app.AccountKeeper, app.BankKeeper),
		bank.NewAppModule(appCodec, app.BankKeeper, app.AccountKeeper),
		capability.NewAppModule(appCodec, *app.CapabilityKeeper),
		crisis.NewAppModule(&app.CrisisKeeper, skipGenesisInvariants),
		gov.NewAppModule(appCodec, app.GovKeeper, app.AccountKeeper, app.BankKeeper),
		mint.NewAppModule(appCodec, app.MintKeeper, app.AccountKeeper),
		slashing.NewAppModule(appCodec, app.SlashingKeeper, app.AccountKeeper, app.BankKeeper, app.StakingKeeper),
		distr.NewAppModule(appCodec, app.DistrKeeper, app.AccountKeeper, app.BankKeeper, app.StakingKeeper),
		staking.NewAppModule(appCodec, app.StakingKeeper, app.AccountKeeper, app.BankKeeper),
		upgrade.NewAppModule(app.UpgradeKeeper),
		evidence.NewAppModule(app.EvidenceKeeper),
		ibc.NewAppModule(app.IBCKeeper),
		params.NewAppModule(app.ParamsKeeper),
		transferModule,
	)

	// During begin block slashing happens after distr.BeginBlocker so that
	// there is nothing left over in the validator fee pool, so as to keep the
	// CanWithdrawInvariant invariant.
	// NOTE: staking module is required if HistoricalEntries param > 0
	app.mm.SetOrderBeginBlockers(
		upgradetypes.ModuleName, minttypes.ModuleName, distrtypes.ModuleName, slashingtypes.ModuleName,
		evidencetypes.ModuleName, stakingtypes.ModuleName, ibchost.ModuleName,
	)
	app.mm.SetOrderEndBlockers(crisistypes.ModuleName, govtypes.ModuleName, stakingtypes.ModuleName)

	// NOTE: The genutils module must occur after staking so that pools are
	// properly initialized with tokens from genesis accounts.
	// NOTE: Capability module must occur first so that it can initialize any capabilities
	// so that other modules that want to create or claim capabilities afterwards in InitChain
	// can do so safely.
	app.mm.SetOrderInitGenesis(
		capabilitytypes.ModuleName, authtypes.ModuleName, banktypes.ModuleName, distrtypes.ModuleName, stakingtypes.ModuleName,
		slashingtypes.ModuleName, govtypes.ModuleName, minttypes.ModuleName, crisistypes.ModuleName,
		ibchost.ModuleName, genutiltypes.ModuleName, evidencetypes.ModuleName, ibctransfertypes.ModuleName,
	)

	app.mm.RegisterInvariants(&app.CrisisKeeper)
	app.mm.RegisterRoutes(app.Router(), app.QueryRouter(), encodingConfig.Amino)
	app.mm.RegisterServices(module.NewConfigurator(app.MsgServiceRouter(), app.GRPCQueryRouter()))

	// add test gRPC service for testing gRPC queries in isolation
	testdata.RegisterQueryServer(app.GRPCQueryRouter(), testdata.QueryImpl{})

	// create the simulation manager and define the order of the modules for deterministic simulations
	//
	// NOTE: this is not required apps that don't use the simulator for fuzz testing
	// transactions
	app.sm = module.NewSimulationManager(
		auth.NewAppModule(appCodec, app.AccountKeeper, authsims.RandomGenesisAccounts),
		bank.NewAppModule(appCodec, app.BankKeeper, app.AccountKeeper),
		capability.NewAppModule(appCodec, *app.CapabilityKeeper),
		gov.NewAppModule(appCodec, app.GovKeeper, app.AccountKeeper, app.BankKeeper),
		mint.NewAppModule(appCodec, app.MintKeeper, app.AccountKeeper),
		staking.NewAppModule(appCodec, app.StakingKeeper, app.AccountKeeper, app.BankKeeper),
		distr.NewAppModule(appCodec, app.DistrKeeper, app.AccountKeeper, app.BankKeeper, app.StakingKeeper),
		slashing.NewAppModule(appCodec, app.SlashingKeeper, app.AccountKeeper, app.BankKeeper, app.StakingKeeper),
		params.NewAppModule(app.ParamsKeeper),
		evidence.NewAppModule(app.EvidenceKeeper),
		ibc.NewAppModule(app.IBCKeeper),
		transferModule,
	)

	app.sm.RegisterStoreDecoders()

	// initialize stores
	app.MountKVStores(keys)
	app.MountTransientStores(tkeys)
	app.MountMemoryStores(memKeys)

	// initialize BaseApp
	app.SetInitChainer(app.InitChainer)
	app.SetBeginBlocker(app.BeginBlocker)
	app.SetAnteHandler(
		ante.NewAnteHandler(
			app.AccountKeeper, app.BankKeeper, ante.DefaultSigVerificationGasConsumer,
			encodingConfig.TxConfig.SignModeHandler(),
		),
	)
	app.SetEndBlocker(app.EndBlocker)

	if loadLatest {
		if err := app.LoadLatestVersion(); err != nil {
			tmos.Exit(err.Error())
		}

		// Initialize and seal the capability keeper so all persistent capabilities
		// are loaded in-memory and prevent any further modules from creating scoped
		// sub-keepers.
		// This must be done during creation of baseapp rather than in InitChain so
		// that in-memory capabilities get regenerated on app restart.
		// Note that since this reads from the store, we can only perform it when
		// `loadLatest` is set to true.
		ctx := app.BaseApp.NewUncachedContext(true, tmproto.Header{})
		app.CapabilityKeeper.InitializeAndSeal(ctx)
	}

	app.ScopedIBCKeeper = scopedIBCKeeper
	app.ScopedTransferKeeper = scopedTransferKeeper

	// NOTE: the IBC mock keeper and application module is used only for testing core IBC. Do
	// note replicate if you do not need to test core IBC or light clients.
	app.ScopedIBCMockKeeper = scopedIBCMockKeeper

	return app
}
```

## InitChainer

The `InitChainer` is a function that initializes the state of the application from a genesis file (i.e. token balances of genesis accounts). It is called when the application receives the `InitChain` message from the Tendermint engine, which happens when the node is started at `appBlockHeight == 0` (i.e. on genesis). The application must set the `InitChainer` in its constructor via the `SetInitChainer` method.

In general, the `InitChainer` is mostly composed of the `InitGenesis` function of each of the application's modules. This is done by calling the `InitGenesis` function of the module manager, which in turn will call the `InitGenesis` function of each of the modules it contains. Note that the order in which the modules' `InitGenesis` functions must be called has to be set in the module manager using the module manager's `SetOrderInitGenesis` method. This is done in the application's constructor, and the `SetOrderInitGenesis` has to be called before the `SetInitChainer`.

See an example of an `InitChainer` from `simapp`:

```
// InitChainer application update at chain initialization
func (app *SimApp) InitChainer(ctx sdk.Context, req abci.RequestInitChain) abci.ResponseInitChain {
	var genesisState GenesisState
	if err := tmjson.Unmarshal(req.AppStateBytes, &genesisState); err != nil {
		panic(err)
	}
	return app.mm.InitGenesis(ctx, app.appCodec, genesisState)
}
```

## BeginBlocker and EndBlocker

The SDK offers developers the possibility to implement automatic execution of code as part of their application. This is implemented through two function called `BeginBlocker` and `EndBlocker`. They are called when the application receives respectively the `BeginBlock` and `EndBlock` messages from the Tendermint engine, which happens at the beginning and at the end of each block. The application must set the `BeginBlocker` and `EndBlocker` in its constructor via the `SetBeginBlocker` and `SetEndBlocker` methods.

In general, the `BeginBlocker` and `EndBlocker` functions are mostly composed of the BeginBlock and EndBlock functions of each of the application's modules. This is done by calling the `BeginBlock` and `EndBlock` functions of the module manager, which in turn will call the `BeginBLock` and `EndBlock` functions of each of the modules it contains. Note that the order in which the modules' `BegingBlock` and `EndBlock` functions must be called has to be set in the module manager using the `SetOrderBeginBlock` and `SetOrderEndBlock` methods respectively. This is done via the module manager in the application's constructor, and the SetOrderBeginBlock and SetOrderEndBlock methods have to be called before the `SetBeginBlocker` and `SetEndBlocker` functions.

As a sidenote, it is important to remember that application-specific blockchains are deterministic. Developers must be careful not to introduce non-determinism in `BeginBlocker` or `EndBlocker`, and must also be careful not to make them too computationally expensive, as gas does not constrain the cost of `BeginBlocker` and `EndBlocker` execution.

See an example of `BeginBlocker` and `EndBlocker` functions from simapp

```
// BeginBlocker application updates every begin block
func (app *SimApp) BeginBlocker(ctx sdk.Context, req abci.RequestBeginBlock) abci.ResponseBeginBlock {
	return app.mm.BeginBlock(ctx, req)
}

// EndBlocker application updates every end block
func (app *SimApp) EndBlocker(ctx sdk.Context, req abci.RequestEndBlock) abci.ResponseEndBlock {
	return app.mm.EndBlock(ctx, req)
}
```

## Register Codec

The `EncodingConfig` structure is the last important part of the `app.go` file. The goal of this structure is to define the codecs that will be used throughout the app.

```
// EncodingConfig specifies the concrete encoding types to use for a given app.
// This is provided for compatibility between protobuf and amino implementations.
type EncodingConfig struct {
	InterfaceRegistry types.InterfaceRegistry
	Marshaler         codec.Marshaler
	TxConfig          client.TxConfig
	Amino             *codec.LegacyAmino
}
```

Here are descriptions of what each of the four fields means:

-   `InterfaceRegistry`: The `InterfaceRegistry` is used by the Protobuf codec to handle interfaces that are encoded and decoded (we also say "unpacked") using google.protobuf.`Any` . Any could be thought as a struct that contains a type_url (name of a concrete type implementing the interface) and a `value` (its encoded bytes). `InterfaceRegistry` provides a mechanism for registering interfaces and implementations that can be safely unpacked from Any. Each of the application's modules implements the `RegisterInterfaces` method that can be used to register the module's own interfaces and implementations.

    -   You can read more about Any in ADR-19.

    -   To go more into details, the SDK uses an implementation of the Protobuf specification called `gogoprotobuf` . By default, the gogo protobuf implementation of `Any` uses global type registration to decode values packed in `Any` into concrete Go types. This introduces a vulnerability where any malicious module in the dependency tree could registry a type with the global protobuf registry and cause it to be loaded and unmarshaled by a transaction that referenced it in the `type_url` field. For more information, please refer to ADR-019.

-   `Marshaler`: the default codec used throughout the SDK. It is composed of a `BinaryCodec` used to encode and decode state, and a `JSONCodec` used to output data to the users (for example in the CLI). By default, the SDK uses Protobuf as `Marshaler`.

-   `TxConfig`: `TxConfig` defines an interface a client can utilize to generate an application-defined concrete transaction type. Currently, the SDK handles two transaction types: `SIGN_MODE_DIRECT` (which uses Protobuf binary as over-the-wire encoding) and `SIGN_MODE_LEGACY_AMINO_JSON` (which depends on Amino). Read more about transactions here.

-   `Amino`: Some legacy parts of the SDK still use Amino for backwards-compatibility. Each module exposes a `RegisterLegacyAmino` method to register the module's specific types within Amino. This Amino codec should not be used by app developers anymore, and will be removed in future releases.

The SDK exposes a `MakeTestEncodingConfig` function used to create a `EncodingConfig` for the app constructor (`NewApp`). It uses Protobuf as a default `Marshaler`. NOTE: this function is marked deprecated and should only be used to create an app or in tests. We are working on refactoring codec management in a post Stargate release.

See an example of a `MakeTestEncodingConfig` from `simapp`:

```
// MakeTestEncodingConfig creates an EncodingConfig for testing.
// This function should be used only internally (in the SDK).
// App user should'nt create new codecs - use the app.AppCodec instead.
// [DEPRECATED]
func MakeTestEncodingConfig() simappparams.EncodingConfig {
	encodingConfig := simappparams.MakeTestEncodingConfig()
	std.RegisterLegacyAminoCodec(encodingConfig.Amino)
	std.RegisterInterfaces(encodingConfig.InterfaceRegistry)
	ModuleBasics.RegisterLegacyAminoCodec(encodingConfig.Amino)
	ModuleBasics.RegisterInterfaces(encodingConfig.InterfaceRegistry)
	return encodingConfig
}
```

## Modules

Modules are the heart and soul of SDK applications. They can be considered as state-machines within the state-machine. When a transaction is relayed from the underlying Tendermint engine via the ABCI to the application, it is routed by `baseapp` to the appropriate module in order to be processed. This paradigm enables developers to easily build complex state-machines, as most of the modules they need often already exist. For developers, most of the work involved in building an SDK application revolves around building custom modules required by their application that do not exist yet, and integrating them with modules that do already exist into one coherent application. In the application directory, the standard practice is to store modules in the `x/` folder (not to be confused with the SDK's `x/` folder, which contains already-built modules).

## Application Module Interface

Modules must implement interfaces defined in the Libonomy SDK, `AppModuleBasic` and `AppModule`. The former implements basic non-dependant elements of the module, such as the `codec`, while the latter handles the bulk of the module methods (including methods that require references to other modules' `keeper`s). Both the `AppModule` and `AppModuleBasic` types are defined in a file called `./module.go.`

`AppModule` exposes a collection of useful methods on the module that facilitates the composition of modules into a coherent application. These methods are are called from the `module manager`(../building-modules/module-manager.md#manager), which manages the application's collection of modules.

## `Msg` Services

Each module defines two Protobuf services : one `Msg` service to handle messages, and one gRPC `Query` service to handle queries. If we consider the module as a state-machine, then a `Msg` service is a set of state transition RPC methods. Each Protobuf `Msg` service method is 1:1 related to a Protobuf request type, which must implement `sdk.Msg` interface. Note that `sdk.Msg`s are bundled in transactions, and each transaction contains one or multiple messages.

When a valid block of transactions is received by the full-node, Tendermint relays each one to the application via `DeliverTx` . Then, the application handles the transaction:

1. Upon receiving the transaction, the application first unmarshalls it from `[]bytes`.

2. Then, it verifies a few things about the transaction like fee payment and signatures before extracting the `Msg`(s) contained in the transaction.

3. `sdk.Msg`s are encoded using Protobuf `Any`s. By analyzing each `Any`'s `type_url`, baseapp's `msgServiceRouter` routes the `sdk.Msg` to the corresponding module's `Msg` service.

4. If the message is successfully processed, the state is updated.`

For a more details look at a transaction lifecycle.

Module developers create custom `Msg` services when they build their own module. The general practice is to define the Msg Protobuf service in a `tx.proto` file. For example, the `x/bank` module defines a service with two methods to transfer tokens:

```
// Msg defines the bank Msg service.
service Msg {
  // Send defines a method for sending coins from one account to another account.
  rpc Send(MsgSend) returns (MsgSendResponse);

  // MultiSend defines a method for sending coins from some accounts to other accounts.
  rpc MultiSend(MsgMultiSend) returns (MsgMultiSendResponse);
}
```

Service methods use `keeper` in order to update the module state.

Each module should also implement the `RegisterServices` method as part of the `AppModule` interface. This method should call the `RegisterMsgServer` function provided by the generated Protobuf code.

## gRPC `Query` Services

gRPC `Query` services are introduced in the v0.40 Stargate release. They allow users to query the state using gRPC . They are enabled by default, and can be configued under the `grpc.enable` and `grpc.address` fields inside `app.toml`.

gRPC `Query` services are defined in the module's Protobuf definition files, specifically inside `query.proto`. The `query.proto` definition file exposes a single `Query` Protobuf service . Each gRPC query endpoint corresponds to a service method, starting with the `rpc` keyword, inside the `Query` service.

Protobuf generates a `QueryServer` interface for each module, containing all the service methods. A module's `keeper` then needs to implement this `QueryServer` interface, by providing the concrete implementation of each service method. This concrete implementation is the handler of the corresponding gRPC query endpoint.

Finally, each module should also implement the `RegisterServices` method as part of the `AppModule` interface. This method should call the `RegisterQueryServer` function provided by the generated Protobuf code.

## Keeper

`Keepers` are the gatekeepers of their module's store(s). To read or write in a module's store, it is mandatory to go through one of its `keeper`'s methods. This is ensured by the object-capabilities model of the Libonomy SDK. Only objects that hold the key to a store can access it, and only the module's `keeper` should hold the key(s) to the module's store(s).

`Keepers` are generally defined in a file called `keeper.go`. It contains the `keeper`'s type definition and methods.

The `keeper` type definition generally consists of:

-   **Key(s)** to the module's store(s) in the multistore.

-   Reference to **other module's `keepers`**. Only needed if the `keeper` needs to access other module's store(s) (either to read or write from them).

-   A reference to the application's **codec**. The `keeper` needs it to marshal structs before storing them, or to unmarshal them when it retrieves them, because stores only accept `[]bytes` as value.

Along with the type definition, the next important component of the `keeper.go` file is the `keeper`'s constructor function, `NewKeeper`. This function instantiates a new `keeper` of the type defined above, with a `codec`, store `keys` and potentially references to other modules' `keeper`s as parameters. The `NewKeeper` function is called from the application's constructor. The rest of the file defines the `keeper`'s methods, primarily getters and setters.

## Command-Line, gRPC Services and REST Interfaces

Each module defines command-line commands, gRPC services and REST routes to be exposed to end-user via the application's interfaces. This enables end-users to create messages of the types defined in the module, or to query the subset of the state managed by the module.

## CLI

Generally, the commands related to a module are defined in a folder called `client/cli` in the module's folder. The CLI divides commands in two category, transactions and queries, defined in `client/cli/tx.go` and `client/cli/query.go` respectively. Both commands are built on top of the Cobra Library :

-   Transactions commands let users generate new transactions so that they can be included in a block and eventually update the state. One command should be created for each message type defined in the module. The command calls the constructor of the message with the parameters provided by the end-user, and wraps it into a transaction. The SDK handles signing and the addition of other transaction metadata.

-   Queries let users query the subset of the state defined by the module. Query commands forward queries to the application's query router, which routes them to the appropriate querier the `queryRoute` parameter supplied.

## gRPC

gRPC is a modern open source high performance RPC framework that has support in multiple languages. It is the recommended way for external clients (such as wallets, browsers and other backend services) to interact with a node.

Each module can expose gRPC endpoints, called service methods and are defined in the module's Protobuf `query.proto` file. A service method is defined by its name, input arguments and output response. The module then needs to:

-   define a `RegisterGRPCGatewayRoutes` method on `AppModuleBasic` to wire the client gRPC requests to the correct handler inside the module.

-   for each service method, define a corresponding handler. The handler implements the core logic necessary to serve the gRPC request, and is located in the `keeper/grpc_query.go` file.

## gRPC-gateway REST Endpoints

Some external clients may not wish to use gRPC. The SDK provides in this case a gRPC gateway service, which exposes each gRPC service as a correspoding REST endpoint. Please refer to the grpc-gateway documentation to learn more.

The REST endpoints are defined in the Protobuf files, along with the gRPC services, using Protobuf annotations. Modules that want to expose REST queries should add `google.api.http` annotations to their rpc methods. By default, all REST endpoints defined in the SDK have an URL starting with the /` Libonomy`/ prefix.

The SDK also provides a development endpoint to generate Swagger definition files for these REST endpoints. This endpoint can be enabled inside the `app.toml` config file, under the `api.swagger` key.

## Legacy API REST Endpoints

The module's Legacy REST interface lets users generate transactions and query the state through REST calls to the application's Legacy API Service. REST routes are defined in a file `client/rest/rest.go`, which is composed of:

-   A `RegisterRoutes` function, which registers each route defined in the file. This function is called from the main application's interface for each module used within the application. The router used in the SDK is Gorilla's mux .

-   Custom request type definitions for each query or transaction creation function that needs to be exposed. These custom request types build on the base `request` type of the Libonomy SDK:

```
// BaseReq defines a structure that can be embedded in other request structures
// that all share common "base" fields.
type BaseReq struct {
	From          string       `json:"from"`
	Memo          string       `json:"memo"`
	ChainID       string       `json:"chain_id"`
	AccountNumber uint64       `json:"account_number"`
	Sequence      uint64       `json:"sequence"`
	TimeoutHeight uint64       `json:"timeout_height"`
	Fees          sdk.Coins    `json:"fees"`
	GasPrices     sdk.DecCoins `json:"gas_prices"`
	Gas           string       `json:"gas"`
	GasAdjustment string       `json:"gas_adjustment"`
	Simulate      bool         `json:"simulate"`
}
```

-   One handler function for each request that can be routed to the given module. These functions implement the core logic necessary to serve the request.

These Legacy API endpoints are present in the SDK for backward compatibility purposes and will be removed in the next release.

## Application Interface

Interfaces let end-users interact with full-node clients. This means querying data from the full-node or creating and sending new transactions to be relayed by the full-node and eventually included in a block.

The main interface is the Command-Line Interface. The CLI of an SDK application is built by aggregating CLI commands defined in each of the modules used by the application. The CLI of an application is the same as the daemon (e.g. `appd`), and defined in a file called `appd/main.go`. The file contains:

-   A **`main()` function** , which is executed to build the `appd` interface client. This function prepares each command and adds them to the rootCmd before building them. At the root of `appd`, the function adds generic commands like `status`, `keys` and `config`, query commands, tx commands and `rest-server`.

-   **Query commands** are added by calling the `queryCmd` function. This function returns a Cobra command that contains the query commands defined in each of the application's modules (passed as an array of `sdk.ModuleClients` from the `main()` function), as well as some other lower level query commands such as block or validator queries. Query command are called by using the command `appd query [query]` of the CLI.

-   **Transaction commands** are added by calling the `txCmd` function. Similar to `queryCmd`, the function returns a Cobra command that contains the tx commands defined in each of the application's modules, as well as lower level tx commands like transaction signing or broadcasting. Tx commands are called by using the command `appd tx [tx]` of the CLI.

See an example of an application's main command-line file from the nameservice tutorial

```
package main

import (
	"os"
	"path"

	"github.com/  Libonomy/  Libonomy-sdk/client"
	"github.com/  Libonomy/  Libonomy-sdk/client/keys"
	"github.com/  Libonomy/  Libonomy-sdk/client/lcd"
	"github.com/  Libonomy/  Libonomy-sdk/client/rpc"
	sdk "github.com/  Libonomy/  Libonomy-sdk/types"
	"github.com/  Libonomy/  Libonomy-sdk/version"
	authcmd "github.com/  Libonomy/  Libonomy-sdk/x/auth/client/cli"
	authrest "github.com/  Libonomy/  Libonomy-sdk/x/auth/client/rest"
	bankcmd "github.com/  Libonomy/  Libonomy-sdk/x/bank/client/cli"
	app "github.com/  Libonomy/sdk-tutorials/nameservice"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	amino "github.com/tendermint/go-amino"
	"github.com/tendermint/tendermint/libs/cli"
)

func main() {
	cobra.EnableCommandSorting = false

	cdc := app.MakeCodec()

	// Read in the configuration file for the sdk
	config := sdk.GetConfig()
	config.SetBech32PrefixForAccount(sdk.Bech32PrefixAccAddr, sdk.Bech32PrefixAccPub)
	config.SetBech32PrefixForValidator(sdk.Bech32PrefixValAddr, sdk.Bech32PrefixValPub)
	config.SetBech32PrefixForConsensusNode(sdk.Bech32PrefixConsAddr, sdk.Bech32PrefixConsPub)
	config.Seal()

	rootCmd := &cobra.Command{
		Use:   "nscli",
		Short: "nameservice Client",
	}

	// Add --chain-id to persistent flags and mark it required
	rootCmd.PersistentFlags().String(client.FlagChainID, "", "Chain ID of tendermint node")
	rootCmd.PersistentPreRunE = func(_ *cobra.Command, _ []string) error {
		return initConfig(rootCmd)
	}

	// Construct Root Command
	rootCmd.AddCommand(
		rpc.StatusCommand(),
		client.ConfigCmd(app.DefaultCLIHome),
		queryCmd(cdc),
		txCmd(cdc),
		client.LineBreak,
		lcd.ServeCommand(cdc, registerRoutes),
		client.LineBreak,
		keys.Commands(),
		client.LineBreak,
		version.Cmd,
		client.NewCompletionCmd(rootCmd, true),
	)

	executor := cli.PrepareMainCmd(rootCmd, "NS", app.DefaultCLIHome)
	err := executor.Execute()
	if err != nil {
		panic(err)
	}
}

func registerRoutes(rs *lcd.RestServer) {
	client.RegisterRoutes(rs.CliCtx, rs.Mux)
	authrest.RegisterTxRoutes(rs.CliCtx, rs.Mux)
	app.ModuleBasics.RegisterRESTRoutes(rs.CliCtx, rs.Mux)
}

func queryCmd(cdc *amino.Codec) *cobra.Command {
	queryCmd := &cobra.Command{
		Use:     "query",
		Aliases: []string{"q"},
		Short:   "Querying subcommands",
	}

	queryCmd.AddCommand(
		authcmd.GetAccountCmd(cdc),
		client.LineBreak,
		rpc.ValidatorCommand(cdc),
		rpc.BlockCommand(),
		authcmd.QueryTxsByEventsCmd(cdc),
		authcmd.QueryTxCmd(cdc),
		client.LineBreak,
	)

	// add modules' query commands
	app.ModuleBasics.AddQueryCommands(queryCmd, cdc)

	return queryCmd
}

func txCmd(cdc *amino.Codec) *cobra.Command {
	txCmd := &cobra.Command{
		Use:   "tx",
		Short: "Transactions subcommands",
	}

	txCmd.AddCommand(
		bankcmd.SendTxCmd(cdc),
		client.LineBreak,
		authcmd.GetSignCommand(cdc),
		authcmd.GetMultiSignCommand(cdc),
		client.LineBreak,
		authcmd.GetBroadcastCommand(cdc),
		authcmd.GetEncodeCommand(cdc),
		client.LineBreak,
	)

	// add modules' tx commands
	app.ModuleBasics.AddTxCommands(txCmd, cdc)

	return txCmd
}

func initConfig(cmd *cobra.Command) error {
	home, err := cmd.PersistentFlags().GetString(cli.HomeFlag)
	if err != nil {
		return err
	}

	cfgFile := path.Join(home, "config", "config.toml")
	if _, err := os.Stat(cfgFile); err == nil {
		viper.SetConfigFile(cfgFile)

		if err := viper.ReadInConfig(); err != nil {
			return err
		}
	}
	if err := viper.BindPFlag(client.FlagChainID, cmd.PersistentFlags().Lookup(client.FlagChainID)); err != nil {
		return err
	}
	if err := viper.BindPFlag(cli.EncodingFlag, cmd.PersistentFlags().Lookup(cli.EncodingFlag)); err != nil {
		return err
	}
	return viper.BindPFlag(cli.OutputFlag, cmd.PersistentFlags().Lookup(cli.OutputFlag))
}

```

## Dependencies and Makefile

-   A patch introduced in` go-grpc v1.34.0` made gRPC incompatible with the `gogoproto` library, making some gRPC queries panic. As such, the SDK requires that `go-grpc <=v1.33.2 `is installed in your `go.mod`.

To make sure that gRPC is working properly, it is highly recommended to add the following line in your application's `go.mod`:

```
replace google.golang.org/grpc => google.golang.org/grpc v1.33.2

```

Please see issue #8392 for more info.

This section is optional, as developers are free to choose their dependency manager and project building method. That said, the current most used framework for versioning control is `go.mod`. It ensures each of the libraries used throughout the application are imported with the correct version. See an example from the nameservice tutorial :

```
module github.com/  Libonomy/sdk-application-tutorial

go 1.13

require (
	github.com/  Libonomy/  Libonomy-sdk v0.37.3
	github.com/gorilla/mux v1.7.3
	github.com/mattn/go-isatty v0.0.7 // indirect
	github.com/spf13/afero v1.2.2 // indirect
	github.com/spf13/cobra v0.0.5
	github.com/spf13/viper v1.4.0
	github.com/stretchr/testify v1.4.0
	github.com/tendermint/go-amino v0.15.1
	github.com/tendermint/tendermint v0.32.6
	github.com/tendermint/tm-db v0.2.0
	golang.org/x/sys v0.0.0-20190329044733-9eb1bfa1ce65 // indirect
	google.golang.org/genproto v0.0.0-20190327125643-d831d65fe17d // indirect
)
```

For building the application, a Makefile is generally used. The Makefile primarily ensures that the go.mod is run before building the two entrypoints to the application, `appd` and `appd`. See an example of Makefile from the nameservice tutorial

```
PACKAGES=$(shell go list ./... | grep -v '/simulation')

VERSION := $(shell echo $(shell git describe --tags) | sed 's/^v//')
COMMIT := $(shell git log -1 --format='%H')

ldflags = -X github.com/  Libonomy/  Libonomy-sdk/version.Name=NameService \
	-X github.com/  Libonomy/  Libonomy-sdk/version.ServerName=nsd \
	-X github.com/  Libonomy/  Libonomy-sdk/version.ClientName=nscli \
	-X github.com/  Libonomy/  Libonomy-sdk/version.Version=$(VERSION) \
	-X github.com/  Libonomy/  Libonomy-sdk/version.Commit=$(COMMIT)

BUILD_FLAGS := -ldflags '$(ldflags)'

include Makefile.ledger
all: install

install: go.sum
		go install -mod=readonly $(BUILD_FLAGS) ./cmd/nsd
		go install -mod=readonly $(BUILD_FLAGS) ./cmd/nscli

go.sum: go.mod
		@echo "--> Ensure dependencies have not been modified"
		GO111MODULE=on go mod verify

test:
	@go test -mod=readonly $(PACKAGES)
```
