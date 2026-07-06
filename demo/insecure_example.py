import hashlib
import subprocess


def hash_password(password):
    # MD5 hash weak hai isliye GitOwl isko flag karega
    return hashlib.md5(password.encode()).hexdigest()


def run_command(user_input):
    # shell=True ki wajah se yaha pe command injection risk hai
    subprocess.run(user_input, shell=True)


API_KEY = "sk-hardcoded-secret-12345"
