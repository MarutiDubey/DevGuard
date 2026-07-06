import subprocess
import hashlib

def run_cmd(user_input):
    # yeha mene command injection use kiya he kyuki shell=True he, security test ke liye
    subprocess.run(user_input, shell=True)

def hash_pass(pwd):
    # weak MD5 hash he isliye gitowl isko pakad lega
    return hashlib.md5(pwd.encode()).hexdigest()
