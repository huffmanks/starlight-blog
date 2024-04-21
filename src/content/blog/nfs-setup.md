---
title: 'Setting up NFS and Rsync with Linux machines'
description: 'This setup allows bidirectional synchronization between the source HDD and multiple destination HDDs using NFS for network file sharing and rsync for efficient data transfer.'
pubDate: '4/20/2024'
heroImage: '/blog-placeholder-3.jpg'
---

1. Set Up NFS:

-   Install NFS server on the machine where the source HDD is located:

```shell
sudo apt install nfs-kernel-server
```

-   Edit the /etc/exports file to specify directories to be exported:

```shell
/path/to/source *(rw,sync,no_subtree_check)
```

-   Restart the NFS server:

```shell
sudo systemctl restart nfs-kernel-server
```

-   On the machines with destination HDDs, install NFS client:

```shell
sudo apt install nfs-common
```

-   Mount the exported directory from the source machine to the destination machines:

```shell
sudo mount -t nfs source_machine:/path/to/source /mnt/destination
```

2. Sync Data Using Rsync:

-   Write a script to sync data bidirectionally between the mounted NFS directories on the destination machines.

```shell
#!/bin/bash

# Sync changes from NFS mount on destination machine to local HDD
rsync -avu --delete /mnt/destination /path/to/destination_on_hdd

# Sync changes from local HDD to NFS mount on destination machine
rsync -avu --delete /path/to/source_on_hdd /mnt/destination
```

-   Make the script executable:

```shell
chmod +x sync_nfs_hdds.sh
```

-   Run the script periodically using cron or manually as needed.

## Examples

1. NFS Export Configuration:

```shell
# Replace "/path/to/source" with the actual path to the directory you want to share
/home/user/data *(rw,sync,no_subtree_check)
```

This line will export the /home/user/data directory with read-write access, synchronous writes, and no subtree checking.

2. Mounting NFS Share:

```shell
# Replace "source_machine" with the IP address or hostname of the NFS server
# Replace "/path/to/source" with the actual exported path on the NFS server
# Replace "/mnt/destination" with the local mount point on the destination machine
sudo mount -t nfs 192.168.1.100:/home/user/data /mnt/data
```

This command will mount the /home/user/data directory from the NFS server with IP address 192.168.1.100 to the local mount point /mnt/data.

3. Syncing Data Using Rsync:

```shell
# Sync changes from NFS mount on destination machine to local HDD
rsync -avu --delete /mnt/data /mnt/local_backup

# Sync changes from local HDD to NFS mount on destination machine
rsync -avu --delete /mnt/local_backup /mnt/data
```

These commands will synchronize changes bidirectionally between the NFS mount point /mnt/data on the destination machine and the local directory /mnt/local_backup. Adjust the paths according to your actual setup and requirements.
