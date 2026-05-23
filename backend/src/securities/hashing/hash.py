import hashlib

from passlib.context import CryptContext

from src.config.manager import settings


class HashGenerator:
    def __init__(self):
        self._hash_ctx_layer_1: CryptContext = CryptContext(
            schemes=[settings.HASHING_ALGORITHM_LAYER_1], deprecated="auto"
        )
        self._hash_ctx_layer_2: CryptContext = CryptContext(
            schemes=[settings.HASHING_ALGORITHM_LAYER_2], deprecated="auto"
        )
        self._hash_ctx_salt: str = settings.HASHING_SALT

    @property
    def _get_hashing_salt(self) -> str:
        return self._hash_ctx_salt

    @property
    def generate_password_salt_hash(self) -> str:
        """
        A function to generate a hash from Bcrypt to append to the user password.
        """
        return hashlib.sha256(self._get_hashing_salt.encode("utf-8")).hexdigest()

    def _normalize_password_secret(self, secret: str) -> str:
        """
        Collapse the password material into a fixed-length digest before passing it to the hash backend.
        This prevents bcrypt's 72-byte input limit from being hit by long passwords.
        """
        return hashlib.sha256(secret.encode("utf-8")).hexdigest()

    def generate_password_hash(self, hash_salt: str, password: str) -> str:
        """
        A function that adds the user's password with the layer 1 Bcrypt hash, before
        hash it for the second time using Argon2 algorithm.
        """
        return self._hash_ctx_layer_2.hash(secret=self._normalize_password_secret(secret=f"{hash_salt}{password}"))

    def is_password_verified(self, password: str, hashed_password: str) -> bool:
        """
        A function that decodes users' password and verifies whether it is the correct password.
        """
        # Try with normalized password first (standard for all new passwords to avoid length limits)
        try:
            result = self._hash_ctx_layer_2.verify(secret=self._normalize_password_secret(secret=password), hash=hashed_password)
        except ValueError:
            result = False

        # If normalized password verification fails, try with raw password (for backward compatibility with old accounts)
        if not result:
            try:
                result = self._hash_ctx_layer_2.verify(secret=password, hash=hashed_password)
            except ValueError:
                return False
        
        return result


def get_hash_generator() -> HashGenerator:
    return HashGenerator()


hash_generator: HashGenerator = get_hash_generator()
