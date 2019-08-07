#!/usr/bin/env python3
# The script will insert filename-based yaml headers to notes without.

from argparse import ArgumentParser
from frontmatter import Frontmatter
from time import sleep
import os, re

def yamler(filename):
    filename = filename[11:-3] # cut date and extension
    filename = re.sub("-", " ", filename) # replace all - with spaces
    yam = "---\ntitle: " + filename.capitalize() + "\ntags: [ ]\n---\n"
    return yam

def is_yaml_exist(filepath):
    post = Frontmatter.read_file(filepath)
    if post["frontmatter"]:
        #need to also check "Title:" node inside frontmatter object
        return True
    else:
        return False

def is_dir_path(string):
    if os.path.isdir(string):
        return string
    else:
        raise NotADirectoryError(string)

parser = ArgumentParser(description="Insert filename-based yaml headers to notes files in Notes DB.")
parser.add_argument("-p", "--path", help="Path to the Notes DB", metavar="DIR", type=is_dir_path, default="")
args = parser.parse_args()
DBpath = args.path

for root, dirs, files in os.walk(DBpath):
    for filename in files:
        #sleep(0.01) 
        if filename.endswith(".md"):
            mdfile = os.path.join(root, filename) 
            #print("CHECKING:" + mdfile)
            if is_yaml_exist(mdfile) == True:
                print("PROPER YAML: " + mdfile)
            else:
                dataout = yamler(filename)
                print("FIXING: " + mdfile)
                print("")
                print(dataout)
                try:
                    with open(mdfile, "r+") as fo:
                        content = fo.read()
                        fo.seek(0,0)
                        fo.write(dataout + content)
                        print("SUCCESS!")
                except IOError:
                    print("FAILED!")
        else:
            print("NON-MD: " + os.path.join(DBpath, filename))