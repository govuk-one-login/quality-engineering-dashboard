# CONFIG

Data exports and other private configuration data should not be commited to this repository.

Instead, they should be placed within the `.config` folder, and a data loader should be used as layer of indirection.

e.g.

```bash
if [ -f .config/aws-accountid-config.json ]
then
  cat .config/aws-accountid-config.json
else
  cat src/data/config/examples/aws-accountid-config.json
fi
```

In order to guide the shape of data required, a synthetic file should be placed within the examples folder. Due to the interconnected nature of some of this data, these files are not expected to correctly link up. This could perhaps be an area for future efforts.
