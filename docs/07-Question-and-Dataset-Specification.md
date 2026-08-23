# Question and Dataset Specification

## 1. Purpose

Questions are the core learning content of Checkpoint.

They must be stored in a structured format so the administrator can add or update many questions without manually entering them one by one through the UI.

V1 therefore uses JSON datasets.

---

## 2. Supported question types

### MCQ

Exactly four options and exactly one correct option.

Example:

```text
Which keyword is used to inherit a class in Java?

A. extends
B. implements
C. inherits
D. super
```

---

### True/False

One boolean answer.

Example:

```text
Java supports class inheritance.

True / False
```

---

### Fill in the Blank

The student types an answer.

The dataset can contain multiple accepted answers.

Example:

```json
{
  "answer": ["jvm", "java virtual machine"]
}
```

Matching is normalized for case and whitespace.

We do not use fuzzy matching in V1 because predictable grading is more important.

---

## 3. Difficulty

Questions use:

```text
EASY
MEDIUM
HARD
EXPERT
```

Difficulty describes the content.

It does not describe the student's mastery.

---

## 4. Explanation

Every question requires an explanation.

This is a deliberate learning requirement.

A question should not simply say:

```text
Wrong.
```

It should explain:

```text
Correct answer: extends

Why:
The extends keyword is used when one Java class inherits from another.
```

---

## 5. External IDs

Every question receives an external ID supplied by the dataset creator.

Example:

```text
JAVA-OOP-001
```

This lets the importer recognize that:

```text
JAVA-OOP-001
```

in version 1.1 is the same logical question as:

```text
JAVA-OOP-001
```

in version 1.0.

---

## 6. Dataset example

```json
{
  "dataset": {
    "name": "Java Core Fundamentals",
    "version": "1.0",
    "description": "Core Java practice questions"
  },
  "questions": [
    {
      "externalId": "JAVA-OOP-001",
      "topic": "Java",
      "subtopic": "OOP",
      "type": "MCQ",
      "difficulty": "EASY",
      "question": "Which keyword is used to inherit a class in Java?",
      "options": [
        "extends",
        "implements",
        "inherits",
        "super"
      ],
      "answer": "extends",
      "explanation": "The extends keyword is used for class inheritance."
    }
  ]
}
```

---

## 7. Validation

Before import, the system validates the complete dataset.

Examples of invalid data:

- missing question text;
- missing explanation;
- invalid difficulty;
- invalid question type;
- duplicate external ID;
- MCQ with three options;
- MCQ with five options;
- two correct MCQ answers;
- answer not matching an option.

If one question is invalid, the entire import is rejected.

This avoids partial datasets.

---

## 8. Two-stage safety

The administrator can first call:

```text
validate
```

and inspect the result.

When they later call:

```text
import
```

the server validates again.

This protects against the file changing between validation and import.

---

## 9. Import behavior

Existing external IDs are updated.

New external IDs are inserted.

Missing topics can be created automatically.

The entire operation is transactional.

Therefore:

```text
100 valid questions
+
1 invalid question
=
0 questions imported
```

rather than:

```text
99 imported
1 failed
```

---

## 10. Answer security

The database may contain the correct answer.

That is fine.

The important rule is:

> The correct answer must not be sent to the student before submission.

For MCQ, the server can randomize the option order when constructing the student response.

This prevents a dataset from always having the correct answer in option B, for example.

---

## 11. Initial question bank

The initial V1 bank should target approximately:

```text
100–150 curated questions
```

Quality is more important than quantity.

The bank should contain enough variety to exercise:

- new-question selection;
- review;
- difficulty;
- topics;
- Fast Practice;
- XP calculations.

---

## 12. Retiring questions

A question can become inactive:

```text
is_active = false
```

Reasons could include:

- factual error;
- outdated content;
- poor wording;
- duplicate;
- bad explanation.

The question is not physically deleted.

Historical attempts remain available.
