UPDATE topics t
SET name = 'General'
FROM subjects s
WHERE t.subject_id = s.id
  AND lower(t.name) = lower(s.name)
  AND NOT EXISTS (
      SELECT 1 FROM topics x
      WHERE x.subject_id = s.id AND lower(x.name) = 'general'
  );
