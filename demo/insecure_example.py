import hashlib
import subprocess


def hash_password(password):
    # Weak hashing algorithm
    return hashlib.md5(password.encode()).hexdigest()


def run_command(user_input):
    # Command injection risk
    subprocess.run(user_input, shell=True)


API_KEY = "sk-hardcoded-secret-12345"
