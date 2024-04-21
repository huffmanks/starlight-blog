```shell
find /path/to/dir1 -maxdepth 1 -type d -printf "%f\n" | sort > dir1_contents.txt
find /path/to/dir2 -maxdepth 1 -type d -printf "%f\n" | sort > dir2_contents.txt
diff dir1_contents.txt dir2_contents.txt
```
