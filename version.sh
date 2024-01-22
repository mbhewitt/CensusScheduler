#!/usr/bin/env bash
major_version='E'
username=`git config user.name`
pullnumber=`git ls-remote origin 'pull/*/head'|awk -F/ '{print $3}'|sort -n|tail -n1|awk '{printf("%05d\n", $1+1)}'`
if [ "$(uname)" == "Darwin" ]; then
    year=`date -v "+120d" "+%Y"`
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    year=`date "+%Y" -d "+ 120 days"`
fi
ln -s -f ../../version.sh .git/hooks/pre-commit >/dev/null 2>/dev/null
echo "$year.$major_version.$pullnumber.$username" > new_current_version.txt
