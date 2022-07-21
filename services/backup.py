import os
from datetime import datetime

# file backup
environment_vars = {
    'PASSPHRASE': '145e1d6d5d1c0b18c66cc593b62d55cd',
    'FTP_PASSWORD': 'asdf0147'
}
sftp_url = 'sftp://userone@52.77.237.15:2255/backup'
backup_folder_url = '/home/andalib/Projects/backup_test/'
log_folder_url = '/var/log/duplicity/aws.log'

for key, val in environment_vars.items():
    os.environ[key] = val

time_now = datetime.now()

if time_now.weekday() == 2:
    os.system('duplicity remove-all-but-n-full 1 --force {} >>{}'.format(sftp_url, log_folder_url))
    os.system('duplicity full --no-encryption {} {} >>{}'.format(backup_folder_url, sftp_url, log_folder_url))
else:
    os.system('duplicity incremental --no-encryption {} {} >>{}'.format(backup_folder_url, sftp_url, log_folder_url))

for key, val in environment_vars.items():
    del os.environ[key]

# database backup
backup_folder_url = '/home/andalib/backup/db-{}.pgsql'.format(time_now.date())
log_folder_url = '/var/log/pg_dump/db-{}.log'.format(time_now.date())
os.system('pg_dump -U andalib workflow_glob > {} 2>{}'.format(backup_folder_url, log_folder_url))
