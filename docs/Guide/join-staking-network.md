---
sidebar_position: 2
---
# Join the staking network
You can run the daemon service, synchronize with staking layer and interact with the hain through CLI
> Complete documentation is in progress

:::info Assuming you have already installed cusp, you will be able to carry out the below process system wide.
The chain that you are trying to connect to should be main-stake unless the development team
allows the access to other networking channels of aphelion protocol. On **main-stake** channel only staking related activities are allowed and you will not be able to interact with AI layer and  other hybrid channels of aphelion protocol. If you want to understand aphelion protocol, head over to our [Whitepaper](https://libonomy.com/assets/pdf/white-paper-libonomy-v2.0.pdf)
:::
## Manual Setup

For fresh setup of your mainnet node, download the latest **genesis** file of **main-stake** from libonomy github or reach discord and carry out the below process
:::info Remember : Checksum for genesis.json is

91e7cab91704c2e88db079a690d3ff3c171e27df17fac38851b298ea651059fc

:::
You need to run the unsafe command which will reset any previous data and will make required directories in the home location
```bash
cuspd unsafe-reset-all
```
Now you need to copy the main-stake genesis file into config directory
or move your genesis file to the config path.
```bash
cp -i /path/to/genesis.json ~/.cuspd/config/
mv genesis.json $HOME/.cuspd/config
```

As your node doesn't know from where it could fetch the blocks, you need to add some seeds. You can do that by editing the config file. Within config.toml file, in the section [p2p] edit line#171
persistent_peers and add the peers given below in comma separated form, save and exit the config
```bash
"4084941c41afd659dd530a9f2f0f90b25ad7b016@52.6.191.132:26656,d75874a10c730fbb49ca2c941923f76e4c6aa8e1@3.80.90.168:26656"
```
:::info Remember
If these peers dont work, you can reach our github or check out the latest peer list from development team

:::

## Run a Full Node
You can run your full node by the following command
```bash
 cuspd start
```

If you want to check the status of your node, run
```bash
cuspd status
```


