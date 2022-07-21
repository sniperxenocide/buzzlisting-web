#!/usr/bin/env python

import getopt
import os
from shutil import rmtree
from distutils.core import setup

import sys
from Cython.Build import cythonize

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def delete_migration_files():
    for root, dirs, files in os.walk(BASE_DIR + '/apps', topdown=True):
        for name in files:
            real_file = os.path.join(root, name)

            if name.endswith('py') and name != __file__ and not name.startswith('fpdf.py'):
                if name == '__init__.py':
                    pass
                elif '/migrations' in root:
                    os.remove(real_file)

            if name.endswith('.so'):
                os.remove(real_file)


def cythonize_files():
    for root, dirs, files in os.walk(BASE_DIR + '/apps', topdown=True):
        for name in files:
            real_file = os.path.join(root, name)

            # if 'bpmn/migrations' in root and name != '__init__.py':
            #     os.remove(real_file)

            if name.endswith('py') and '/migrations' not in root and name != __file__:
                if name == '__init__.py':
                    continue
                if name == 'urls.py':
                    continue
                elif 'dms/api/document' in root and name == 'fpdf.py':
                    continue
                # elif 'dms/documents' in root and name == 'elastic_search.py':
                #     continue
                # elif 'workflow/bpmn' in root and name == 'elasticsearch.py':
                #     continue
                else:
                    setup(name="something", ext_modules=cythonize(real_file))
                    c_file = real_file.replace('.py', '.c')
                    os.remove(c_file)
                    os.remove(real_file)

        for d in dirs:
            real_dir_path = os.path.join(root, d)

            if d == '__pycache__' and os.path.exists(real_dir_path):
                rmtree(real_dir_path)


def main(argv):
    try:
        opts, args = getopt.getopt(
            argv, "", ["delete=", "inplace=", "build_ext="])
    except getopt.GetoptError:
        print('setup.py --delete or build_ext --inplace')
        sys.exit(2)

    for arg in args:
        if arg in ('build_ext',):
            cythonize_files()

    for opt, arg in opts:
        if opt in ("--delete",):
            delete_migration_files()


if __name__ == "__main__":
    main(sys.argv[1:])
