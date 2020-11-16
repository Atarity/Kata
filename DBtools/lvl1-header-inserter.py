#!/usr/bin/env python3
# The script will insert level 1 header (based on filename) just after YAML meta.

from argparse import ArgumentParser
from time import sleep
import frontmatter, os, sys

# Chech if YAML meta exists and get title node
def get_title(filepath):
    post = frontmatter.load(filepath)
    if post["title"]:
        return post["title"], post.content
    else:
        return False

def is_dir_path(string):
    if os.path.isdir(string):
        return string
    else:
        raise NotADirectoryError(string)

parser = ArgumentParser(description="Insert filename-based, level 1 header to Kata notes")
parser.add_argument("-p", "--path", help="Path to the Notes DB", metavar="DIR", type=is_dir_path, default="")
args = parser.parse_args()
DBpath = args.path

count_sucess, count_failed, count_found, count_woyaml, count_nonmd, count_total = 0, 0, 0, 0, 0, 0

for root, dirs, files in os.walk(DBpath):
    for filename in files:
        sleep(0.001)
        if filename.endswith(".md"):
            mdfile = os.path.join(root, filename)
            print("CHECK:" + mdfile)
            if get_title(mdfile) != False:
                tit, con = get_title(mdfile)
                print("TITLE: " + tit)
                #print("CONT: " + con)
                if not con.strip().startswith("# "):
                    try:
                        with open(mdfile, "r+") as fo:
                            dataout = "# " + tit + "\n"
                            txt = fo.read().encode('UTF-8')
                            # seeking index of content start
                            fo.seek(txt.index(con.encode('UTF-8')), 0)
                            fo.write(dataout + con)
                            fo.close()
                            if get_title(mdfile) != False:
                                print("SUCCESS!\n")
                                count_sucess += 1
                            else:
                                print("BROKEN NOW: " + mdfile)
                                sys.exit(1)
                    except IOError:
                        print("FAILED!\n")
                        count_failed += 1
                else:
                    print ("H1 FOUND\n")
                    count_found += 1
            else:
                print("W/O YAML: " + mdfile)
                count_woyaml += 1
        else:
            print("NON-MD: " + os.path.join(DBpath, filename))
            count_nonmd += 1
        count_total += 1

print(" ")
print("Changed: {0}".format(count_sucess))
print("Failed: {0}".format(count_failed))
print("H1 found: {0}".format(count_found))
print("W/O YAML: {0}".format(count_woyaml))
print("Non-md: {0}".format(count_nonmd))
print("TOTAL: {0}".format(count_total))