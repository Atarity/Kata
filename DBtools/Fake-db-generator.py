#!/usr/bin/env python3
# The script will generate totally fake database of Notes.
# Check below variables before usage!

from argparse import ArgumentParser
from time import sleep
from faker import Faker
import os, re, datetime, random

NUM_OF_YEARS = 3
NUM_OF_NOTES = 10 # it is better to keep less than 365 Notes per year in variables
MAX_WORDS_IN_FILENAMES = 6
MAX_TAGS_PER_NOTE = 3
NUM_OF_DIFF_TAGS = 50 # Number of different tags should always be less than 205
MIN_TODO_ENTRIES = 3
MAX_TODO_ENTRIES = 30
MAX_TEXT_BLOCKS = 4
MAX_CHARS_IN_BLOCK = 800 # maximum chars in 1 text block
Fishes = ["bass", "blay", "bley", "brit", "carp", "chad", "char", "chub", "clam", "coho", "crab", "cusk", "dace", "dart", "dory", "drum", "fugu", "gade", "goby", "grig", "hake", "hoki", "huso", "jack", "kelt", "keta", "ling", "luce", "mako", "masu", "moki", "mort", "opah", "orfe", "parr", "peal", "peel", "pike", "pope", "pout", "rudd", "ruff", "scad", "scar", "scup", "shad", "snig", "sole", "spat", "tope", "tuna", "tusk", "ablet", "allis", "basse", "bleak", "bream", "brill", "charr", "cisco", "cobia", "cohoe", "coley", "doree", "dorse", "elops", "elver", "fluke", "gaper", "gibel", "grunt", "guppy", "lance", "loach", "manta", "moray", "murry", "nerka", "nurse", "padle", "perai", "perch", "piper", "pirai", "pogge", "porgy", "powan", "prawn", "prawn", "roker", "ruffe", "saith", "sargo", "saury", "sewen", "sewin", "shark", "skate", "smelt", "smolt", "snoek", "snook", "sprat", "sprod", "squid", "squit", "tench", "togue", "torsk", "trout", "tunny", "whelk", "whiff", "witch", "yabby", "alevin", "allice", "anabas", "angler", "barbel", "beluga", "blenny", "bonito", "bowfin", "brassy", "buckie", "bumalo", "burbot", "caplin", "cheven", "chevin", "cockle", "comber", "conger", "conner", "cunner", "darter", "dentex", "dipnoi", "doctor", "dorado", "duncow", "ellops", "finnac", "finnan", "finner", "gadoid", "ganoid", "garvie", "goramy", "gossat", "grilse", "groper", "gunnel", "gurami", "gurnet", "launce", "mahsir", "maigre", "marlin", "meagre", "megrim", "milter", "minnow", "morgay", "mudcat", "mullet", "murena", "murray", "murrey", "mussel", "oyster", "paddle", "paidle", "pirana", "piraya", "plaice", "pollan", "porgie", "remora", "robalo", "ruffin", "saithe", "salmon", "samlet", "sander", "sardel", "sauger", "saurel", "seeder", "sephen", "shanny", "shiner", "shrimp", "sucker", "sucker", "tautog", "trygon", "turbot", "twaite", "weever", "winkle", "wrasse", "yabbie", "zander", "zingel"]
Cut_fishes = Fishes[:NUM_OF_DIFF_TAGS]
files_in_dir = NUM_OF_NOTES//NUM_OF_YEARS # not more than 365
fake = Faker()

def is_dir_path(string):
    if os.path.isdir(string):
        return string
    else:
        raise NotADirectoryError(string)

def file_name_generator(files_n, year):
    def fake_filename():
        f = fake.sentence(nb_words=MAX_WORDS_IN_FILENAMES, variable_nb_words=True, ext_word_list=None)
        f = f.replace(" ", "-")
        return f[:-1]

    start = datetime.datetime.strptime(str(year) + "-01-01", "%Y-%m-%d")
    list_generated = [(start + datetime.timedelta(days=x)).strftime("%Y-%m-%d") + "-" + fake_filename() + ".md" for x in range(0, files_n)]
    return list_generated

def content_generator(filename):
    def filename_fixer(fi):
        fi = fi[11:-3] # cut date and extension
        fi = re.sub("-", " ", fi) # replace all - with spaces
        return fi.capitalize()

    def tags_generator():
        tags = ""
        for t in range(0, random.randint(0, MAX_TAGS_PER_NOTE)):
            fish = random.choice(Cut_fishes)
            if fish not in tags:
                tags += str(fish + ", ")
            else:
                break
        return tags

    def todo_generator():
        todo = ""
        for p in range(0, random.randint(MIN_TODO_ENTRIES, MAX_TODO_ENTRIES)):
            td = fake.sentence(nb_words=6, variable_nb_words=True, ext_word_list=None)
            td = td[:-1]
            
            if random.choice([True, False]) == True:
                todo += "\n- [ ] " + td
            else :
                todo += "\n- [X] ~~" + td + "~~"
        return todo

    def text_generator():
        fk = ""
        for b in range(0, random.randint(0, MAX_TEXT_BLOCKS)): 
            tit = fake.sentence(nb_words=6, variable_nb_words=True, ext_word_list=None)
            tit = tit[:-1] # trim dot, cause dots in titles kinda Satan's sucker punch
            fk += ("\n## " + tit.capitalize() + "\n" +
                    fake.text(max_nb_chars=random.randint(50, MAX_CHARS_IN_BLOCK), ext_word_list=None) +
                    "\n")
        return fk

    cont = ("---\ntitle: " + filename_fixer(filename) + "\n" + 
            "tags: [ " + tags_generator() + "]\n---\n" + 
            todo_generator() + "\n" + 
            text_generator())
    return cont

parser = ArgumentParser(description="Insert filename-based yaml headers to notes files in Notes DB.")
parser.add_argument("-p", "--path", help="Path to the fake Notes DIR. Always ends with /", metavar="DIR", type=is_dir_path, default="")
args = parser.parse_args()
DBpath = args.path

for d in range (0, NUM_OF_YEARS):
    now = datetime.datetime.now()
    year1 = now.year - d
    dir1 = DBpath + str(year1)
    os.mkdir(dir1)
    print("\n DIR CREATED: " + dir1 + "\n")
    sleep(0.5)
    filenames = file_name_generator(files_in_dir, year1)

    for f in range (0, len(filenames)):
        file1 = dir1 + "/" + filenames[f]
        with open(file1, "w") as file:
            content = content_generator(filenames[f])
            file.write(content)
            print("FILE CREATED: " + file1)
            sleep(0.1)

