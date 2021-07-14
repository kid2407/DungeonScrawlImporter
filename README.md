![Latest version](https://img.shields.io/github/v/tag/kid2407/DungeonScrawlImporter?label=Latest%20Version&sort=semver)
![Latest Release Download Count](https://img.shields.io/github/downloads/kid2407/DungeonScrawlImporter/latest/module.zip?label=Downloads(latest))
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2FdungeonScrawlImporter&colorB=4aa94a)

# DungeonScrawlImporter

Foundry module to allow importing a .ds file generated with Dungeon Scrawl to automatically generate walls.

The following features / bugs are known:
* Detection of doors is not implemented
* Overlapping Walls block of passages they shouldn't
* The number of Walls is rather high, it is recommended to install [Merge Walls](https://foundryvtt.com/packages/mergewalls) and use it to reduce the wall count