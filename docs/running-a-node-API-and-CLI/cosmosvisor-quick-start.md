---
sidebar_position: 6
---

# Libonomyvisor Quick Start

`cosmovisor` is a small process manager for Libonomy SDK application binaries that monitors the governance module via stdout for incoming chain upgrade proposals. If it sees a proposal that gets approved, `cosmovisor` can automatically download the new binary, stop the current binary, switch from the old binary to the new one, and finally restart the node with the new binary.

Note: If new versions of the application are not set up to run in-place store migrations, migrations will need to be run manually before restarting `cosmovisor` with the new binary. For this reason, we recommend applications adopt in-place store migrations.

## Installation

To install `cosmovisor`, run the following command:

```
go get github.com/Libonomy/Libonomy-sdk/cosmovisor/cmd/cosmovisor

```

## Command Line Arguments And Environment Variables

All arguments passed to `cosmovisor` will be passed to the application binary (as a subprocess). `cosmovisor` will return /dev/stdout and /dev/stderr of the subprocess as its own. For this reason, `cosmovisor` cannot accept any command-line arguments other than those available to the application binary, nor will it print anything to output other than what is printed by the application binary.

`cosmovisor` reads its configuration from environment variables:

-   `DAEMON_HOME` is the location where the `cosmovisor`/ directory is kept that contains the genesis binary, the upgrade binaries, and any additional auxiliary files associated with each binary (e.g. $HOME/.gaiad, $HOME/.regend, $HOME/.simd, etc.).

-   `DAEMON_NAME` is the name of the binary itself (e.g. gaiad, regend, simd, etc.).

-   `DAEMON_ALLOW_DOWNLOAD_BINARIES` (optional), if set to true, will enable auto-downloading of new binaries (for security reasons, this is intended for full nodes rather than validators). By default, `cosmovisor` will not auto-download new binaries.

-   `DAEMON_RESTART_AFTER_UPGRADE` (optional), if set to true, will restart the subprocess with the same command-line arguments and flags (but with the new binary) after a successful upgrade. By default, `cosmovisor` stops running after an upgrade and requires the system administrator to manually restart it. Note that cosmovisor will not auto-restart the subprocess if there was an error.

## Folder Layout

`$DAEMON_HOME/cosmovisor` is expected to belong completely to `cosmovisor` and the subprocesses that are controlled by it. The folder content is organized as follows:
`

```
.
├── current -> genesis or upgrades/<name>
├── genesis
│   └── bin
│       └── $DAEMON_NAME
└── upgrades
    └── <name>
        └── bin
            └── $DAEMON_NAME

```

The cosmovisor/ directory incudes a subdirectory for each version of the application (i.e. genesis or` upgrades/<name>`). Within each subdirectory is the application binary (i.e. bin/$DAEMON_NAME) and any additional auxiliary files associated with each binary. current is a symbolic link to the currently active directory (i.e. genesis or `upgrades/<name>`). The name variable in `upgrades/<name>` is the URI-encoded name of the upgrade as specified in the upgrade module plan.

Please note that $DAEMON_HOME/cosmovisor only stores the application binaries. The cosmovisor binary itself can be stored in any typical location (e.g. /usr/local/bin). The application will continue to store its data in the default data directory (e.g. $HOME/.gaiad) or the data directory specified with the --home flag. $DAEMON_HOME is independent of the data directory and can be set to any location. If you set $DAEMON_HOME to the same directory as the data directory, you will end up with a configuation like the following:

```
.gaiad
├── config
├── data
└── cosmovisor

```
