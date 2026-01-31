# shecrets

Encrypted secrets files that are safe to commit to git.

Each `.she` file is a self-contained SQLite3 database where every secret field is individually encrypted with **AES-256-GCM** and keys are derived using **Argon2id**. The encryption is strong enough that `.she` files can live right alongside your code in version control.

## Install

```bash
pnpm add -g shecrets
```

### From source

```bash
git clone https://github.com/LazerThings/shecrets.git
cd shecrets/shecrets
pnpm install
pnpm build
pnpm link --global
```

## Quick start

```bash
# Create an encrypted secrets file
shecrets init passwords.she

# Add a secret
shecrets passwords.she -c "AWS Production"

# List all entries
shecrets passwords.she -l

# Copy password to clipboard
shecrets passwords.she --pC "AWS Production"

# Open the interactive TUI browser
shecrets passwords.she
```

## How it works

A `.she` file stores:

- **Metadata** (unencrypted): a UUID, a 32-byte random salt, and a verification blob
- **Entries** (encrypted): each entry's name, username, and password are encrypted separately with their own random 12-byte nonce

When you open a file, shecrets:

1. Checks your OS keychain for the stored passphrase (by UUID)
2. If not found, prompts you for the passphrase
3. Derives a 256-bit key using Argon2id (64 MB memory, 3 iterations, 4 parallelism)
4. Verifies the key against the stored verification blob
5. Offers to save the passphrase to your keychain for next time

## CLI reference

### Create a new secrets file

```bash
shecrets init <file.she>
```

Prompts for a passphrase (with confirmation), creates the encrypted database, and offers to save the passphrase to your OS keychain.

### Save passphrase to keychain

```bash
shecrets keychain <file.she>
```

Manually save the passphrase to your OS keychain. Useful if you declined the prompt during `init` or on a new machine.

### Create an entry

```bash
shecrets <file.she> -c "Entry Name"
```

Prompts for username and password, then stores the encrypted entry.

### List entries

```bash
shecrets <file.she> -l
```

Lists all entry names. Entries with auto mode enabled are marked `[auto]`.

### Get a secret

```bash
# Output to stdout
shecrets <file.she> --uO "Entry Name"   # username
shecrets <file.she> --pO "Entry Name"   # password

# Copy to clipboard
shecrets <file.she> --uC "Entry Name"   # username
shecrets <file.she> --pC "Entry Name"   # password
```

By default, get operations require interactive confirmation (`y/N` prompt). If the entry has **auto mode** enabled, the confirmation is skipped, which enables piping:

```bash
shecrets server.she --pO "SSH Root" | sshpass ssh root@server
```

### Edit an entry

```bash
shecrets <file.she> --eU "Entry Name"   # edit username
shecrets <file.she> --eP "Entry Name"   # edit password
```

### Remove an entry

```bash
shecrets <file.she> -r "Entry Name"
```

### Auto mode

```bash
shecrets <file.she> --enable-auto "Entry Name"
shecrets <file.she> --disable-auto "Entry Name"
```

Auto mode skips the confirmation prompt for get, edit, and remove operations on that entry. This is a convenience flag — it does not affect encryption.

## TUI browser

```bash
shecrets <file.she>
```

Running with no flags opens an interactive terminal UI.

### Entry list

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate |
| `Enter` | Open entry |
| `n` | New entry |
| `q` | Quit |

### Entry detail

| Key | Action |
|-----|--------|
| `u` | Copy username to clipboard |
| `p` | Copy password to clipboard |
| `U` | Reveal/hide username |
| `P` | Reveal/hide password |
| `e` | Edit (then `u` for username, `p` for password) |
| `a` | Toggle auto mode |
| `d` | Delete (with confirmation) |
| `Esc` | Back to list |

### Create entry form

Sequential prompts for name, username, password, and password confirmation. `Esc` cancels at any step.

## Keychain integration

shecrets uses your OS keychain to store passphrases so you don't have to type them every time.

| Platform | Backend |
|----------|---------|
| macOS | Keychain Access (`security` CLI) |
| Linux | Secret Service (`secret-tool` CLI) |
| Windows | Credential Manager (PowerShell) |

Each passphrase is stored under the service name `shecrets` with the file's UUID as the account identifier. Different `.she` files have independent keychain entries.

## Security model

- **Key derivation**: Argon2id with 64 MB memory cost, 3 time cost, 4 parallelism, 32-byte output
- **Encryption**: AES-256-GCM with random 12-byte nonces and 16-byte auth tags
- **Per-field encryption**: Each field (name, username, password) is encrypted with its own nonce
- **Verification**: A known plaintext is encrypted and stored to validate the passphrase without revealing any secrets
- **No plaintext on disk**: The SQLite database only contains ciphertext and the salt/nonces needed for decryption

The salt and nonces are not secret — they exist to ensure that identical plaintexts produce different ciphertexts. The security rests entirely on the strength of your passphrase and the Argon2id parameters.

## Database schema

```sql
CREATE TABLE metadata (
    uuid       TEXT NOT NULL,
    salt       BLOB NOT NULL,
    verify     BLOB NOT NULL,
    verify_iv  BLOB NOT NULL
);

CREATE TABLE entries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          BLOB NOT NULL,
    name_iv       BLOB NOT NULL,
    username      BLOB NOT NULL,
    username_iv   BLOB NOT NULL,
    password      BLOB NOT NULL,
    password_iv   BLOB NOT NULL,
    auto_enabled  INTEGER DEFAULT 0
);
```

## Publishing

```bash
# Authenticate (once)
pnpm login

# Bump version, build, publish
pnpm build
pnpm version patch
pnpm publish
```

## License

MIT
