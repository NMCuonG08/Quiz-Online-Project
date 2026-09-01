import unittest

from services.capabilities.question_quality import QuestionQualityCapability


class QuestionQualityTests(unittest.TestCase):
    @staticmethod
    def valid_question(text="Python là gì?"):
        return {
            "question_text": text,
            "question_type": "SINGLE_CHOICE",
            "options": [
                {"option_text": "Ngôn ngữ lập trình", "is_correct": True},
                {"option_text": "Hệ điều hành", "is_correct": False},
            ],
        }

    def test_report_contains_checks_and_passes_valid_question(self):
        report = QuestionQualityCapability.inspect_question(self.valid_question())

        self.assertTrue(report.passed)
        self.assertTrue(any(check.code == "QUESTION_CORRECT_OPTION_INVALID" for check in report.checks))
        self.assertEqual(report.question_count, 1)

    def test_report_catches_duplicate_questions_and_options(self):
        duplicate = self.valid_question()
        duplicate["options"][1]["option_text"] = duplicate["options"][0]["option_text"]
        report = QuestionQualityCapability.inspect_quiz({
            "questions": [self.valid_question(), duplicate],
        })

        self.assertFalse(report.passed)
        self.assertTrue(any(check.code == "QUESTION_OPTION_DUPLICATE" for check in report.checks))
        self.assertTrue(any(check.code == "QUESTION_DUPLICATE" for check in report.checks))

    def test_legacy_validation_error_codes_are_preserved(self):
        with self.assertRaisesRegex(ValueError, "QUESTION_OPTIONS_REQUIRED"):
            QuestionQualityCapability.validate_question_payload({
                "question_text": "Python là gì?",
                "question_type": "SINGLE_CHOICE",
                "options": [{"option_text": "A", "is_correct": True}],
            })

    def test_quiz_validation_requires_questions(self):
        with self.assertRaisesRegex(ValueError, "QUIZ_QUESTIONS_REQUIRED"):
            QuestionQualityCapability.validate_quiz_payload({"questions": []})
