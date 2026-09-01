import unittest

from services.hardening import evaluate_production_hardening


def production_env():
    return {
        "NODE_ENV": "production",
        "AI_EXECUTOR_API_KEY": "secret-value",
        "AI_REQUIRE_REDIS": "true",
        "REDIS_URL": "redis://redis:6379/0",
        "AGENT_CHECKPOINTER": "postgres",
        "AI_CHECKPOINT_DATABASE_URL": "postgresql://checkpoint@db/quiz",
        "CORS_ORIGINS": "https://quiz.example.com",
        "BACKEND_URL": "https://api.example.com",
        "WEB_SEARCH_PROVIDER": "disabled",
        "AGENT_MAX_MODEL_CALLS": "24",
        "AGENT_MAX_TOOL_CALLS": "32",
        "AGENT_MAX_TOTAL_TOKENS": "100000",
    }


class ProductionHardeningTests(unittest.TestCase):
    def test_valid_production_configuration_passes_without_exposing_secrets(self):
        report = evaluate_production_hardening(production_env())

        self.assertTrue(report.ready)
        self.assertEqual(report.blocking_failures, [])
        serialized = report.model_dump_json()
        self.assertNotIn("secret-value", serialized)

    def test_production_missing_durable_dependencies_fails_with_safe_messages(self):
        values = production_env()
        values.update({
            "AI_REQUIRE_REDIS": "false",
            "AGENT_CHECKPOINTER": "disabled",
            "CORS_ORIGINS": "*",
            "AGENT_MAX_TOOL_CALLS": "0",
        })

        report = evaluate_production_hardening(values)

        self.assertFalse(report.ready)
        self.assertTrue(any("Redis" in item for item in report.blocking_failures))
        self.assertTrue(any("checkpoint" in item.lower() for item in report.blocking_failures))
        self.assertTrue(any("CORS" in item for item in report.blocking_failures))
        self.assertTrue(any("budget" in item.lower() for item in report.blocking_failures))

    def test_placeholder_credentials_are_rejected(self):
        values = production_env()
        values["AI_EXECUTOR_API_KEY"] = "your_openai_api_key"

        report = evaluate_production_hardening(values)

        self.assertFalse(report.ready)
        self.assertTrue(any("placeholder" in item for item in report.blocking_failures))

    def test_development_mode_reports_non_blocking_hardening(self):
        values = production_env()
        values["NODE_ENV"] = "development"
        values.pop("AI_EXECUTOR_API_KEY")

        report = evaluate_production_hardening(values)

        self.assertTrue(report.ready)
        self.assertEqual(report.environment, "development")


if __name__ == "__main__":
    unittest.main()

