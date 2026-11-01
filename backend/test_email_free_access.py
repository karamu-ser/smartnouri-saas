"""Isolated API regressions: python -m unittest discover -s backend -p 'test_email_free_access.py'."""
import importlib
import os
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import Mock, patch


class EmailFreeAccessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import bcrypt
        import dotenv
        from fastapi.testclient import TestClient

        cls.temp = tempfile.TemporaryDirectory(prefix="smartnouri-api-test-")
        cls.addClassCleanup(cls.temp.cleanup)
        cls.original_cwd = os.getcwd()
        cls.addClassCleanup(os.chdir, cls.original_cwd)
        cls.backend_dir = str(Path(__file__).resolve().parent)
        sys.path.insert(0, cls.backend_dir)
        cls.addClassCleanup(sys.path.remove, cls.backend_dir)
        os.chdir(cls.temp.name)
        environment = patch.dict(os.environ, {
            "DATABASE_URL": f"sqlite:///{cls.temp.name}/test.db",
            "SECRET_KEY": "isolated-test-key-never-used-in-production-12345",
            "ADMIN_PASSWORD_HASH": bcrypt.hashpw(b"test-admin", bcrypt.gensalt(rounds=4)).decode(),
            "SECURITY_LOG_DIR": f"{cls.temp.name}/logs",
            "TURNSTILE_SECRET_KEY": "1x0000000000000000000000000000000AA",
        })
        environment.start()
        cls.addClassCleanup(environment.stop)
        # Never load the project's real secrets or initialize a real AI/email provider.
        dotenv_patch = patch.object(dotenv, "load_dotenv", return_value=False)
        dotenv_patch.start()
        cls.addClassCleanup(dotenv_patch.stop)
        cls.ai = types.ModuleType("ai_service")
        cls.ai.extract_menu_from_images = Mock()
        module_patch = patch.dict(sys.modules, {"ai_service": cls.ai})
        module_patch.start()
        cls.addClassCleanup(module_patch.stop)
        smtp_patch = patch("smtplib.SMTP", side_effect=AssertionError("SMTP must never be used"))
        cls.smtp = smtp_patch.start()
        cls.addClassCleanup(smtp_patch.stop)
        cls.api = importlib.import_module("main")
        cls.models = importlib.import_module("models")
        cls.database = importlib.import_module("database")
        cls.security = importlib.import_module("security")
        cls.migrations = importlib.import_module("migrate_db")
        cls.client = TestClient(cls.api.app)
        turnstile_patch = patch.object(cls.api.requests, "post")
        cls.turnstile = turnstile_patch.start()
        cls.addClassCleanup(turnstile_patch.stop)
        cls.addClassCleanup(cls.client.close)
        cls.addClassCleanup(cls.database.engine.dispose)
        cls.addClassCleanup(cls.close_log_handlers)

    @classmethod
    def close_log_handlers(cls):
        for handler in cls.api.security_logger.handlers[:]:
            handler.close()
            cls.api.security_logger.removeHandler(handler)

    def setUp(self):
        self.models.Base.metadata.drop_all(self.database.engine)
        self.models.Base.metadata.create_all(self.database.engine)
        self.api.limiter._storage.reset()
        self.ai.extract_menu_from_images.reset_mock()
        self.ai.extract_menu_from_images.side_effect = None
        self.ai.extract_menu_from_images.return_value = {
            "categories": [{"name": "Plats", "items": [{"name": "Couscous", "price": 45}]}],
        }
        self.turnstile.reset_mock()
        self.turnstile.return_value.raise_for_status.return_value = None
        self.turnstile.return_value.json.return_value = {"success": True}

    def tearDown(self):
        self.smtp.assert_not_called()

    def create_account(self, **overrides):
        payload = {
            "name": "Café Démo",
            "contact_phone": "+212600000001",
            "captcha_token": "XXXX.DUMMY.TOKEN.XXXX",
            **overrides,
        }
        response = self.client.post("/api/v1/restaurants", json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.headers["cache-control"], "no-store")
        return response.json()

    def login(self, account, **overrides):
        return self.client.post("/api/v1/client/login", json={
            "identifier": account["client_identifier"], "password": account["client_password"], **overrides,
        })

    def reset_password(self, account, **overrides):
        return self.client.post("/api/v1/client/forgot-password", json={
            "identifier": account["client_identifier"],
            "recovery_code": account["client_recovery_code"],
            "new_password": "new-secure-password-123",
            **overrides,
        })

    def upload(self, account):
        return self.client.post(f'/api/v1/restaurants/{account["id"]}/menu/upload', files=[
            ("files", ("menu.jpg", b"\xff\xd8\xffisolated-test-image", "image/jpeg")),
        ])

    def test_creation_without_email_hashes_credentials_and_slug_login(self):
        account = self.create_account()
        self.assertIsNone(account["client_email"])
        self.assertEqual(account["client_identifier"], "cafe-demo")
        self.assertGreaterEqual(len(account["client_password"]), 12)
        self.assertGreaterEqual(len(account["client_recovery_code"]), 40)
        with self.database.SessionLocal() as db:
            record = db.get(self.models.Restaurant, account["id"])
            self.assertNotEqual(record.client_password_hash, account["client_password"])
            self.assertNotEqual(record.client_recovery_code_hash, account["client_recovery_code"])
            self.assertTrue(self.security.verify_password(account["client_recovery_code"], record.client_recovery_code_hash))
        logged_in = self.login(account)
        self.assertEqual(logged_in.status_code, 200, logged_in.text)
        mine = self.client.get("/api/v1/client/restaurant", headers={
            "Authorization": f'Bearer {logged_in.json()["access_token"]}',
        })
        self.assertEqual(mine.status_code, 200, mine.text)
        self.assertEqual(mine.json()["id"], account["id"])

    def test_optional_email_empty_null_and_duplicate_restaurant_names(self):
        first = self.create_account(contact_email="", contact_phone="0612 34 56 78")
        second = self.create_account(contact_email=None, contact_phone="+212712345678")
        self.assertEqual(first["contact_phone"], "+212612345678")
        self.assertNotEqual(first["client_identifier"], second["client_identifier"])
        self.assertEqual(second["client_identifier"], "cafe-demo-1")
        self.assertEqual(self.login(second).status_code, 200)

    def test_phone_must_be_moroccan_and_is_never_reusable(self):
        for phone in ["+33123456789", "+212412345678", "+21261234567", "+2126123456789"]:
            response = self.client.post("/api/v1/restaurants", json={
                "name": "Invalid", "contact_phone": phone, "captcha_token": "valid-token",
            })
            self.assertEqual(response.status_code, 422, response.text)

        account = self.create_account(contact_phone="00212612345678")
        admin_token = self.security.create_access_token({"sub": "admin"})
        deleted = self.client.delete(
            f'/api/v1/restaurants/{account["id"]}',
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        self.assertEqual(deleted.status_code, 200, deleted.text)
        reused = self.client.post("/api/v1/restaurants", json={
            "name": "Second", "contact_phone": "+212612345678", "captcha_token": "valid-token",
        })
        self.assertEqual(reused.status_code, 409, reused.text)
        self.assertIn("déjà été utilisé", reused.json()["detail"])

    def test_captcha_is_mandatory_and_verified_before_creation(self):
        missing = self.client.post("/api/v1/restaurants", json={
            "name": "No captcha", "contact_phone": "+212612345678",
        })
        self.assertEqual(missing.status_code, 422)

        self.turnstile.return_value.json.return_value = {"success": False}
        failed = self.client.post("/api/v1/restaurants", json={
            "name": "Bot", "contact_phone": "+212612345678", "captcha_token": "expired",
        })
        self.assertEqual(failed.status_code, 400, failed.text)
        with self.database.SessionLocal() as db:
            self.assertEqual(db.query(self.models.Restaurant).count(), 0)
            self.assertEqual(db.query(self.models.PhoneRegistration).count(), 0)

    def test_secrets_absent_from_public_admin_and_client_reads(self):
        account = self.create_account()
        token = self.login(account).json()["access_token"]
        admin_token = self.security.create_access_token({"sub": "admin"})
        responses = [
            self.client.get(f'/api/v1/restaurants/{account["id"]}'),
            self.client.get(f'/api/v1/restaurants/slug/{account["slug"]}'),
            self.client.get("/api/v1/client/restaurant", headers={"Authorization": f"Bearer {token}"}),
            self.client.get("/api/v1/restaurants", headers={"Authorization": f"Bearer {admin_token}"}),
        ]
        for response in responses:
            self.assertEqual(response.status_code, 200, response.text)
            self.assertNotIn(account["client_password"], response.text)
            self.assertNotIn(account["client_recovery_code"], response.text)
            self.assertNotIn("client_password_hash", response.text)
            self.assertNotIn("client_recovery_code", response.text)

    def test_legacy_email_login_and_existing_token_still_work(self):
        account = self.create_account(contact_email="client@example.com")
        response = self.client.post("/api/v1/client/login", json={
            "email": "client@example.com", "password": account["client_password"],
        })
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.login(account, identifier="client@example.com").status_code, 200)
        token = self.security.create_access_token({"sub": "client@example.com", "role": "client"})
        response = self.client.get("/api/v1/client/restaurant", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], account["id"])

    def test_phone_is_neither_login_identifier_nor_recovery_secret(self):
        account = self.create_account()
        self.assertEqual(self.login(account, identifier=account["contact_phone"]).status_code, 401)
        self.assertEqual(self.reset_password(account, recovery_code=account["contact_phone"]).status_code, 400)
        self.assertEqual(self.login(account).status_code, 200)

    def test_wrong_recovery_unknown_account_and_old_account_do_not_mutate_password(self):
        account = self.create_account()
        wrong = self.reset_password(account, recovery_code="wrong-code")
        unknown = self.reset_password(account, identifier="unknown-restaurant")
        self.assertEqual(wrong.status_code, 400)
        self.assertEqual(unknown.json(), wrong.json())
        with self.database.SessionLocal() as db:
            record = db.get(self.models.Restaurant, account["id"])
            record.client_recovery_code_hash = None
            db.commit()
        legacy = self.reset_password(account)
        self.assertEqual(legacy.json(), wrong.json())
        self.assertEqual(self.login(account).status_code, 200)

    def test_email_only_reset_no_longer_changes_password(self):
        account = self.create_account(contact_email="client@example.com")
        response = self.client.post("/api/v1/client/forgot-password", json={"email": "client@example.com"})
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.login(account).status_code, 200)

    def test_recovery_resets_password_and_saved_key_remains_usable(self):
        account = self.create_account()
        self.assertEqual(self.reset_password(account).status_code, 200)
        self.assertEqual(self.login(account).status_code, 401)
        self.assertEqual(self.login(account, password="new-secure-password-123").status_code, 200)
        self.assertEqual(self.reset_password(account, new_password="another-secure-password").status_code, 200)
        self.assertEqual(self.login(account, password="another-secure-password").status_code, 200)

    def test_invalid_password_lengths_and_identifiers_are_rejected(self):
        account = self.create_account()
        for password in ["short", "é" * 37, "x" * 73]:
            self.assertEqual(self.reset_password(account, new_password=password).status_code, 422)
        self.assertEqual(self.login(account, password="é" * 37).status_code, 422)
        response = self.client.post("/api/v1/client/login", json={"password": "any-password"})
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.login(account).status_code, 200)

    def test_recovery_rate_limit(self):
        for _ in range(5):
            response = self.client.post("/api/v1/client/forgot-password", json={
                "identifier": "missing", "recovery_code": "wrong", "new_password": "valid-password-123",
            })
            self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/v1/client/forgot-password", json={
            "identifier": "missing", "recovery_code": "wrong", "new_password": "valid-password-123",
        })
        self.assertEqual(response.status_code, 429)

    def test_upload_failure_and_empty_extraction_do_not_create_menu(self):
        account = self.create_account()
        self.ai.extract_menu_from_images.side_effect = RuntimeError("AI unavailable")
        self.assertEqual(self.upload(account).status_code, 502)
        self.ai.extract_menu_from_images.side_effect = None
        self.ai.extract_menu_from_images.return_value = {"categories": []}
        self.assertEqual(self.upload(account).status_code, 502)
        with self.database.SessionLocal() as db:
            self.assertEqual(db.query(self.models.Menu).count(), 0)
            self.assertEqual(db.query(self.models.Restaurant).count(), 1)

    def test_upload_retry_replaces_menu_atomically_and_failure_keeps_previous_menu(self):
        account = self.create_account()
        first = self.upload(account)
        self.assertEqual(first.status_code, 200, first.text)
        self.ai.extract_menu_from_images.return_value = {
            "categories": [{"name": "Nouveautés", "items": [{"name": "Tajine", "price": 60}]}],
        }
        retried = self.upload(account)
        self.assertEqual(retried.status_code, 200, retried.text)
        self.assertEqual(retried.json()["id"], first.json()["id"])
        self.ai.extract_menu_from_images.side_effect = RuntimeError("AI unavailable")
        self.assertEqual(self.upload(account).status_code, 502)
        menu = self.client.get(f'/api/v1/restaurants/slug/{account["slug"]}').json()["menus"]
        self.assertEqual(len(menu), 1)
        self.assertEqual(menu[0]["categories"][0]["items"][0]["name"], "Tajine")
        with self.database.SessionLocal() as db:
            self.assertEqual(db.query(self.models.MenuItem).count(), 1)
            self.assertEqual(db.query(self.models.Category).count(), 1)

    def test_idempotent_migration_preserves_existing_credentials(self):
        from sqlalchemy import create_engine, inspect, text
        legacy_engine = create_engine(f"sqlite:///{self.temp.name}/legacy.db")
        try:
            with legacy_engine.begin() as connection:
                connection.execute(text("CREATE TABLE restaurants (id INTEGER PRIMARY KEY, client_password_hash VARCHAR)"))
                connection.execute(text("INSERT INTO restaurants VALUES (1, 'preserved-password-hash')"))
            self.migrations.migrate_database(legacy_engine)
            self.migrations.migrate_database(legacy_engine)
            names = {column["name"] for column in inspect(legacy_engine).get_columns("restaurants")}
            self.assertIn("client_recovery_code_hash", names)
            with legacy_engine.connect() as connection:
                row = connection.execute(text("SELECT client_password_hash, client_recovery_code_hash FROM restaurants")).one()
                self.assertEqual(tuple(row), ("preserved-password-hash", None))
        finally:
            legacy_engine.dispose()


if __name__ == "__main__":
    unittest.main()
