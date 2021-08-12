---
sidebar_position: 1.1
---

# Install Go

<!-- Or **try Docusaurus immediately** with **[docusaurus.new](https://docusaurus.new)**. -->
Install go by official repository version should be above 0.1.12.

Make sure that your gopath is set correctly and the bin is located on the path. E.g

```bash
mkdir -p $HOME/go/bin
echo "export PATH=$PATH:$(go env GOPATH)/bin" >> ~/.bash_profile
source ~/.bash_profile
```

### Installing the services

```bash
git clone https://github.com/libonomy/cusp
```

### Enter the directory

```bash
cd cusp/
```

### In the Cusp Director point to the latest release i.e

```bash
git checkout v1.0.0
```

#### After switching to the latest release, install the required dependencies,

```
make install
```

#### In case of error , install build dependencies

```bash
sudo apt update
sudo apt install build-essential
sudo apt-get install manpages-dev
```

Make sure you are running correct version by using command
- `cuspd version`
- `cuspcli version`

**#It should give you the version 1.0.0**

Running the daemon service and connecting through cli to execute commands

#### From anywhere within your system after installing the services

This command will reset all previous configurations for safe configuration to the mainnet

The chain that you are trying to connect to should be main-stake unless the development team
announces the new version of chain. Always keep your node up to date.

```bash
1. Run cuspd unsafe-reset-all
2. Copy the genesis.json to the ~/.cuspd/config/ director
    "If any genesis already exist replace it with this one"
3. Within ~/.cuspd/config/ directory open config.toml
4. Edit line#16 by assigning name to your node
5. Within config.toml file, in the section [p2p] edit line#171
persistent_peers and add the peers given below.
Add persistent peers
43f7bb1671db3ead72a9943efba102087a593480@18.232.124.100:26656
6. Use screen session to run daemon in the background or
configure using systemd
7. After all is done run cuspd start
Your node is now connected to mainnet
```

:::info Remember : Checksum for genesis.json is

91e7cab91704c2e88db079a690d3ff3c171e27df17fac38851b298ea651059fc

:::

#### Setting up the CLI for interaction

```
cuspcli config node http://127.0.0.1:26657 or use tcp
```

#As you are on local network so config your CLI Flag to true as

```
cuspcli config trust-node true
```

#configure the chain-id

```
cuspcli config chain-id main-stake
```

#### For setting up the rest/rpc service of node

```
cuspcli rest-server --chain-id=main-stake
--laddr=tcp://localhost:1317 --node
tcp://localhost:26657
```


When running the rest node for public access, you need to
allow cors by setting up reverse proxy using nginx or any
other service for REST server. You can enable for aphelion
stake module cors policy within ~/.cuspd/config/config.toml
and edit line#85 and set “*” within cors_allowed_origins =["*"]_



By default: all core services are blocked due to security
conflicts. The upcoming release might include the cors
policy system configs but for now you might have to utilize
in the respective manner



