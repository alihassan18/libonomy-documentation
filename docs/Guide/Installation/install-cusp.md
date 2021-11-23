---
sidebar_position: 1
---

# Install cusp

<!-- Or **try Docusaurus immediately** with **[docusaurus.new](https://docusaurus.new)**. -->
> In this guide we will explain how to install cusp and participate in **POS** network channel of Libonomy.

## Install build requirements
Start by installing make and gcc binaries
```bash
sudo apt-get update

sudo apt-get install -y make gcc

```

## Install GoLang

Install go version 1.15 or above

Start by downloading the tarball 
```bash
curl -O https://dl.google.com/go/go1.15.linux-amd64.tar.gz
```

Extract the tarball into **/usr/local** directory

```bash
sudo tar -xvf go1.15.linux-amd64.tar.gz -C /usr/local
```
Setup your local go directory
```bash
mkdir -p $HOME/go/{bin,src,pkg}
```
Add the environment variables for system wide usage, open profile by
```bash
nano ~/.profile
```
Add the go paths
```bash
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin:/usr/local/go/bin
export GOBIN=$GOPATH/bin
```
With the appropriate line pasted into your profile, save and close the file. Next, refresh your profile by running:

```bash
source ~/.profile
```

## Installing binaries

Next, we need to install the appropriate version of **cusp**
```bash
git clone https://github.com/libonomy/cusp
```

 Enter the directory

```bash
cd cusp/
```

 Within Cusp directory point to the relevant release

```bash
git checkout v1.0.0
```

After switching to the release, install the required dependencies

```
make install
```

In case of error , install build dependencies

```bash
sudo apt update
sudo apt install build-essential
sudo apt-get install manpages-dev
```

Make sure you are running correct version by using command

-   `cuspd version`
-   `cuspcli version`

**Version 1.0.0**

> Now your SDK for interaction with the staking network is properly setup and you can headover to the next section to setup your mainnet node
Running the daemon service and connecting through cli to execute commands
