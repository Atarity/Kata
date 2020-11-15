#!/usr/bin/env python3
# It is in progress. The script will convert Evernote notes to Kata.

from argparse import ArgumentParser
from time import sleep
from lxml import html
import os

def is_dir_path(string):
    if os.path.isdir(string):
        return string
    else:
        raise NotADirectoryError(string)

def get_meta(filepath):
    try:
        with open(filepath, "r") as f:
            page = f.read().encode()
            tree = html.fromstring(page)
            created = tree.xpath('//meta[@name="created"]/@content')
            updated = tree.xpath('//meta[@name="updated"]/@content')
            title = tree.xpath('/html/head/title')[0].text
            if tree.xpath('//meta[@name="keywords"]/@content'):
                keywords = tree.xpath('//meta[@name="keywords"]/@content')
            else:
                keywords = None
            return created, updated, title, keywords
    except:
        halt

parser = ArgumentParser(description="Converting Evernote notes to Kata")
parser.add_argument("-i", "--input_dir", help="Path to the exported Evernot notes", metavar="DIR", type=is_dir_path, default="")
#parser.add_argument("-o", "--output_dir", help="Target path to the converted notes", metavar="DIR", type=is_dir_path, default="")
args = parser.parse_args()
INpath = args.input_dir
#OUTpath = args.output_dir

count_wometa, count_nohtml, count_total = 0, 0, 0

for root, dirs, files in os.walk(INpath):
    for filename in files:
        sleep(0.001)
        if filename.endswith(".html"):
            htmlfile = os.path.join(root, filename)
            print(" ")
            print("TO CONVERT:" + htmlfile)
            if get_meta(htmlfile) != False:
                cr, up, ti, ky = get_meta(htmlfile)
                print(cr)
                print(up)
                print(ti)
                print(ky)
            else:
                print("W/O meta: " + htmlfile)
                count_wometa += 1
        else:
            print("NON-HTML: " + os.path.join(INpath, filename))
            count_nohtml += 1
        count_total += 1

print(" ")
print("W/O meta: {0}".format(count_wometa))
print("Non-html: {0}".format(count_nohtml))
print("TOTAL: {0}".format(count_total))