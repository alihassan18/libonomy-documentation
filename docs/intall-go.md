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
3. Within ~/.cuspd/config/ directory open config.toml
```