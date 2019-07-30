#!/usr/bin/env python3
# this script will convert all yaml list of tags in Notes .md files into a valid yaml lists. 
# It'll replace all your "one, two and a half, three, four" into "[ one, two and a half, three, four ]". 
# Basically just wraps with a brackets.

from argparse import ArgumentParser
import os, re

def is_dir_path(string):
    if os.path.isdir(string):
        return string
    else:
        raise NotADirectoryError(string)

def tags_fixer(string):
    tr = string.group(1).strip()
    a  = tr.translate(tr.maketrans("", "", "[]"))
    res = " [ " + a.strip() + " ]"
    return res

parser = ArgumentParser(description="Fix tags in Notes DB and make them YAML valid.")
parser.add_argument("-p", "--path", help="Path to the Notes DB", metavar="DIR", type=is_dir_path, default="")
args = parser.parse_args()
DBpath = args.path

for root, dirs, files in os.walk(DBpath):
    for filename in files:
        if filename.endswith(".md"): 
            mdfile = os.path.join(root, filename)
            with open(mdfile, "r") as f:
                datafile = f.read()
                # find with refex, send result to tags_fixer and compile output buffer to write
                dataout = re.sub(r"(?<=tags:)(.*?)(?=\n---)", tags_fixer, datafile, flags=re.I)
            with open(mdfile, "w") as fo:
                fo.write(dataout)
                print("FIXED: " + mdfile)
        else:
            print("NON-MD: " + os.path.join(DBpath, filename))
